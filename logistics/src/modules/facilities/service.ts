import { FleetTransportType, CourierStatus, FacilityType, UserRole, VehicleStatus } from "@prisma/client";
import { FastifyInstance } from "fastify";
import { facilityTypeMap } from "./facilityTypeMap.js";
import { AssignCourierData, CreateFacilityData, UpdateFacilityBody } from "./schema.js";

export function generateSortingCode(): string {
  const randomSuffix = Math.floor(Math.random() * 10000);

  return `JTE-${randomSuffix}`
}

export async function getFacilityCouriers(fastify: FastifyInstance, id: number) {
  return await fastify.prisma.user.findMany({
    where: { assignedFacilityId: id, role: UserRole.Courier },
    include: { courier: true }
  })
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

export async function updateFacility(fastify: FastifyInstance, id: number, data: UpdateFacilityBody) {
  const facilityType = data.type ? facilityTypeMap[data.type as FacilityType] : undefined;

  if (data.latitude !== undefined && data.longitude !== undefined) {
    const [updated] = await fastify.prisma.$queryRaw<any[]>`
      UPDATE "facilities"
      SET 
        "name" = COALESCE(${data.name}, "name"),
        "address" = COALESCE(${data.address}, "address"),
        "type" = COALESCE(${facilityType}::facility_type, "type"),
        "parent_id" = COALESCE(${data.parentId}, "parent_id"),
        "location" = ST_SetSRID(ST_MakePoint(${data.longitude}, ${data.latitude}), 4326),
        "updated_at" = NOW()
      WHERE "id" = ${id}
      RETURNING *;
    `;
    if (!updated) throw new Error('FacilityNotFound');
    return updated;
  }

  return await fastify.prisma.facility.update({
    where: { id },
    data: {
      name: data.name,
      address: data.address,
      type: data.type,
      parentId: data.parentId,
    }
  });
}

export async function deleteFacility(fastify: FastifyInstance, id: number) {
  return await fastify.prisma.$transaction(async (tx) => {
    // Unassign users (managers, clerks, couriers) assigned to this facility
    await tx.user.updateMany({
      where: { assignedFacilityId: id },
      data: { assignedFacilityId: null }
    });

    // Unassign physical vehicles assigned to this facility
    await tx.physicalVehicle.updateMany({
      where: { assignedFacilityId: id },
      data: { assignedFacilityId: null }
    });

    // Unassign or clear child facility parent references
    await tx.facility.updateMany({
      where: { parentId: id },
      data: { parentId: null }
    });

    // Delete associated sectors (which blocks deletion due to 'sectors_local_branch_id_fkey')
    await tx.sector.deleteMany({
      where: { localBranchId: id }
    });

    // Delete network legs connected to this facility
    await tx.networkLeg.deleteMany({
      where: {
        OR: [
          { sourceFacilityId: id },
          { destinationFacilityId: id }
        ]
      }
    });

    // Finally, delete the facility itself
    return await tx.facility.delete({
      where: { id }
    });
  });
}

export async function assignCourierToFacility(
  fastify: FastifyInstance,
  data: AssignCourierData
) {
  return fastify.prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: data.userId, role: UserRole.Courier },
      data: { assignedFacilityId: data.id }
    })

    return await tx.facility.findUniqueOrThrow({
      where: { id: data.id },
      include: { users: true }
    })
  })
}

export async function getFacilityById(fastify: FastifyInstance, id: number) {
  return await fastify.prisma.facility.findUniqueOrThrow({
    where: { id }
  });
}

export async function getFacility(fastify: FastifyInstance, id: number) {
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
    WHERE id = ${id}
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
    WHERE local_branch_id = ${id}
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
        WHEN p.current_facility_id = ${id} THEN 'At Hub'
        WHEN p.origin_facility_id = ${id} AND p.status = 'ready_for_pickup' THEN 'Pending Pickup'
        WHEN EXISTS (
          SELECT 1 FROM parcel_facility_pipelines pfp 
          WHERE pfp.parcel_id = p.id AND pfp.facility_id = ${id} AND pfp.status = 'incoming'
        ) THEN 'Incoming'
        ELSE 'In Transit'
      END AS "contextualStatus",
      p.created_at AS "createdAt",
      p.updated_at AS "updatedAt"
    FROM parcels p
    LEFT JOIN stores s ON p.store_id = s.id
    WHERE 
      p.current_facility_id = ${id} -- Physically here
      OR (p.origin_facility_id = ${id} AND p.status = 'ready_for_pickup') -- Waiting at seller for us
      OR EXISTS (
        SELECT 1 FROM parcel_facility_pipelines pfp 
        WHERE pfp.parcel_id = p.id AND pfp.facility_id = ${id} -- Part of our pipeline
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
    WHERE parent_id = ${id}
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

  const usersRaw: any[] = await fastify.prisma.$queryRaw`
    SELECT 
      u.id, 
      u.first_name AS "firstName", 
      u.last_name AS "lastName", 
      u.email,
      u.role,
      json_build_object(
        'id', c.id,
        'phoneNumber', c.phone_number,
        'vehicleType', c.vehicle_type,
        'status', c.status
      ) AS courier
    FROM users u
    LEFT JOIN couriers c ON u.id = c.user_id
    WHERE u.assigned_facility_id = ${id}
    AND u.role = 'courier'::"UserRole"
  `;

  const vehicles = await fastify.prisma.physicalVehicle.findMany({
    where: { assignedFacilityId: id, status: VehicleStatus.Available },
    include: { vehicleProfile: true }
  });

  const sourceLegs = await fastify.prisma.networkLeg.findMany({
    where: { sourceFacilityId: id },
    include: { destinationFacility: true }
  });

  const fleetTransportTypes = Object.values(FleetTransportType)

  const masterBags = await fastify.prisma.masterBag.findMany({
    where: {
      currentFacilityId: id,
      status: 'Sealed',
      courierScheduleId: null
    },
    include: { nextFacility: true }
  });

  return {
    ...facility,
    sectors: sectorsRaw,
    parcels: parcelsRaw,
    children: childrenWithSectors,
    users: usersRaw,
    parent: parentFacility,
    vehicles,
    sourceLegs,
    fleetTransportTypes,
    masterBags,
  }
}

export async function dashboardData(fastify: FastifyInstance) {
  const facilities = await fastify.prisma.facility.findMany()

  return {
    facilities,
    facilityTypes: Object.values(FacilityType),
  }
}

export async function availableCouriers(fastify: FastifyInstance) {
  return await fastify.prisma.courier.findMany({
    where: {
      status: CourierStatus.Available
    }
  })
}