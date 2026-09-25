import { FacilityType } from "@prisma/client";
import { PrismaClient } from "@prisma/client/extension";

export async function createFacility(overrides = {}) {

  const prisma = (globalThis as any).testPrisma as PrismaClient

  const randomSuffix = Math.floor(Math.random() * 10000);

  const latitude = (overrides as any).latitude ?? 120.98
  const longitude = (overrides as any).longitude ?? 14.59

  const { longitude: _, latitude: __, ...cleanOverrides } = overrides as any;

  const facility = await prisma.facility.create({
    data: {
      name: `Test Hub ${randomSuffix}`,
      type: FacilityType.RegionalHub,
      sortingCode: `HUB-${randomSuffix}`,
      address: `${randomSuffix} Test Street, Manila`,
      ...cleanOverrides,
    }
  })

  await prisma.$executeRaw`
    UPDATE facilities
    SET location = ST_SetSRID(ST_MakePoint(${parseFloat(longitude)}, ${parseFloat(latitude)}), 4326)
    WHERE id = ${facility.id}
  `

  return facility
}
