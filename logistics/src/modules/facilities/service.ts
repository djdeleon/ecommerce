import { CourierStatus, FacilityType } from "@prisma/client";
import { FastifyInstance } from "fastify";
import { facilityTypeMap } from "./facilityTypeMap.js";

interface CreateFacilityData {
  name: string;
  type: string;
  address: string;
  longitude: number;
  latitude: number;
}

interface AssignCourierData {
  facilityId: number;
  courierId: number;
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
        "sorting_code",
        "address",
        "location",
        "updated_at"
      ) VALUES (
        ${data.name},
        ${facilityType},
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
    await tx.courier.update({
      where: { id: data.courierId },
      data: { currentFacilityId: data.facilityId }
    })

    return await tx.facility.findUniqueOrThrow({
      where: { id: data.facilityId }, 
      include: { couriers: true }
    })
  })
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