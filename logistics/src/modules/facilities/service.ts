import { CourierStatus, FacilityType, UserRole } from "@prisma/client";
import { FastifyInstance } from "fastify";
import { facilityTypeMap } from "./facilityTypeMap.js";
import { CreateFacilityData } from "./schema.js";

interface AssignCourierData {
  facilityId: number;
  userId: number;
}

export function generateSortingCode(): string {
  const randomSuffix = Math.floor(Math.random() * 10000);

  return `JTE-${randomSuffix}`
}

export async function createFacility(fastify: FastifyInstance, data: CreateFacilityData) {
  const facilityType = facilityTypeMap[data.type as FacilityType]
  const sortingCode = generateSortingCode()

  const [facility] = await fastify.prisma.$queryRaw<any[]>`
      INSERT INTO "facilities" (
        "name",
        "type",
        "code",
        "address",
        "location",
        "updated_at"
      ) VALUES (
        ${data.name},
        ${facilityType}::facility_type,
        ${sortingCode},
        ${data.address},
        ST_SetSRID(ST_MakePoint(${data.longitude}, ${data.latitude}), 4326),
        NOW()
      )
      RETURNING *;
    `;

  return facility
}

export async function updateFacility(
  fastify: FastifyInstance,
  data: AssignCourierData
) {
  return fastify.prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: data.userId, role: UserRole.Courier },
      data: { assignedFacilityId: data.facilityId }
    })

    return await tx.facility.findUniqueOrThrow({
      where: { id: data.facilityId },
      include: { users: true }
    })
  })
}

export async function getFacility(fastify: FastifyInstance, facilityId: number) {
  const facilityRaw: any[] = await fastify.prisma.$queryRaw`
    SELECT 
      id, 
      name, 
      code, 
      address, 
      type, 
      parent_id AS "parentId",
      ST_AsGeoJSON(location)::json AS location,
      created_at AS "createdAt",
      updated_at AS "updatedAt"
    FROM facilities
    WHERE id = ${facilityId}
  `;

  if (!facilityRaw || facilityRaw.length === 0) {
    throw new Error('FacilityNotFound');
  }

  const facility = facilityRaw[0];

  const sectorsRaw: any[] = await fastify.prisma.$queryRaw`
    SELECT 
      id, 
      code, 
      local_branch_id AS "localBranchId", 
      ST_AsGeoJSON(zone)::json AS zone,
      created_at AS "createdAt",
      updated_at AS "updatedAt"
    FROM sectors
    WHERE local_branch_id = ${facilityId}
  `;

  const parcelsRaw: any[] = await fastify.prisma.$queryRaw`
    SELECT 
      p.id, 
      p.tracking_number AS "trackingNumber",
      p.status,
      p.weight_grams AS "weightGrams",
      p.origin_facility_id AS "originFacilityId",
      p.current_facility_id AS "currentFacilityId",
      p.customer_name AS "customerName",
      p.customer_phone AS "customerPhone",
      p.customer_address AS "customerAddress",
      ST_AsGeoJSON(p.customer_location)::json AS "customerLocation",
      json_build_object(
        'id', s.id,
        'name', s.name,
        'address', s.address,
        'contactNumber', s.contact_number,
        'location', ST_AsGeoJSON(s.location)::json
      ) AS store,
      -- 🧠 Added Contextual Logic for the Manager UI
      CASE 
        WHEN p.current_facility_id = ${facilityId} THEN 'At Hub'
        WHEN p.origin_facility_id = ${facilityId} AND p.status = 'ready_for_pickup' THEN 'Pending Pickup'
        WHEN EXISTS (
          SELECT 1 FROM parcel_facility_pipelines pfp 
          WHERE pfp.parcel_id = p.id AND pfp.facility_id = ${facilityId} AND pfp.status = 'incoming'
        ) THEN 'Incoming'
        ELSE 'In Transit'
      END AS "contextualStatus",
      p.created_at AS "createdAt",
      p.updated_at AS "updatedAt"
    FROM parcels p
    LEFT JOIN stores s ON p.store_id = s.id
    WHERE 
      p.current_facility_id = ${facilityId} -- Physically here
      OR (p.origin_facility_id = ${facilityId} AND p.status = 'ready_for_pickup') -- Waiting at seller for us
      OR EXISTS (
        SELECT 1 FROM parcel_facility_pipelines pfp 
        WHERE pfp.parcel_id = p.id AND pfp.facility_id = ${facilityId} -- Part of our pipeline
      )
    ORDER BY p.updated_at DESC
  `;

  const childrenRaw: any[] = await fastify.prisma.$queryRaw`
    SELECT 
      id, 
      name, 
      code, 
      address, 
      type, 
      parent_id AS "parentId",
      ST_AsGeoJSON(location)::json AS location
    FROM facilities
    WHERE parent_id = ${facilityId}
  `;

  const childrenWithSectors = await Promise.all(
    childrenRaw.map(async (child) => {
      const childSectors: any[] = await fastify.prisma.$queryRaw`
        SELECT 
          id, code, local_branch_id AS "localBranchId", 
          ST_AsGeoJSON(zone)::json AS zone
        FROM sectors
        WHERE local_branch_id = ${child.id}
      `;
      return {
        ...child,
        sectors: childSectors
      };
    })
  );

  let parentFacility = null;
  if (facility.parentId) {
    const parentRaw: any[] = await fastify.prisma.$queryRaw`
      SELECT 
        id, 
        name, 
        code, 
        address, 
        type, 
        parent_id AS "parentId",
        ST_AsGeoJSON(location)::json AS location
      FROM facilities
      WHERE id = ${facility.parentId}
    `;
    if (parentRaw.length > 0) {
      const parent = parentRaw[0];
      const parentSectors: any[] = await fastify.prisma.$queryRaw`
        SELECT 
          id, code, local_branch_id AS "localBranchId", 
          ST_AsGeoJSON(zone)::json AS zone
        FROM sectors
        WHERE local_branch_id = ${parent.id}
      `;
      parentFacility = { ...parent, sectors: parentSectors };
    }
  }


  return {
    ...facility,
    sectors: sectorsRaw,
    parcels: parcelsRaw,
    children: childrenWithSectors,
    parent: parentFacility
  }
}

export async function dashboardData(fastify: FastifyInstance) {
  const [facilities, couriers] = await Promise.all([
    fastify.prisma.facility.findMany(),
    availableCouriers(fastify),
  ])

  return {
    facilities,
    facilityTypes: Object.values(FacilityType),
    availableCouriers: couriers
  }
}

export async function availableCouriers(fastify: FastifyInstance) {
  return await fastify.prisma.courier.findMany({
    where: {
      status: CourierStatus.Available
    }
  })
}