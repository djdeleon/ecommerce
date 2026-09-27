import { FacilityType } from "@prisma/client";
import { FastifyInstance } from "fastify";

export async function createFacility(overrides = {}) {
  const app = (globalThis as any).app as FastifyInstance

  const randomSuffix = Math.floor(Math.random() * 10000);

  const longitude = (overrides as any).longitude ?? 121.0673907
  const latitude = (overrides as any).latitude ?? 14.7787567

  const { longitude: _, latitude: __, ...cleanOverrides } = overrides as any;

  const facility = await app.prisma.facility.create({
    data: {
      name: `Test Hub ${randomSuffix}`,
      type: FacilityType.RegionalHub,
      sortingCode: `HUB-${randomSuffix}`,
      address: `${randomSuffix} Test Street, Manila`,
      ...cleanOverrides,
    }
  })

  await app.prisma.$executeRaw`
    UPDATE facilities
    SET location = ST_SetSRID(ST_MakePoint(${parseFloat(longitude)}, ${parseFloat(latitude)}), 4326)
    WHERE id = ${facility.id}
  `

  const [facilityWithLocation] = await app.prisma.$queryRaw<any[]>`
    SELECT 
      id, 
      name, 
      type, 
      "sorting_code" AS "sortingCode", 
      address, 
      "parent_id" AS "parentId", 
      "isActive", 
      "created_at" AS "createdAt", 
      "updated_at" AS "updatedAt",
      ST_AsGeoJSON(location) AS location
    FROM "facilities"
    WHERE id = ${facility.id}
  `;

  return facilityWithLocation
}
