import { FastifyInstance } from "fastify";
import { CreateSectorBody, UpdateSectorBody } from "./schema.js";


export async function getSectors(fastify: FastifyInstance) {
  return await fastify.prisma.sector.findMany({
    include: {
      barangays: true,
      localBranch: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createSector(
  fastify: FastifyInstance,
  data: CreateSectorBody
) {
  const { code, facilityId, zone, barangayIds } = data

  const [sector] = await fastify.prisma.$queryRaw<any[]>`
    INSERT INTO "sectors" ("code", "facility_id", "zone", "created_at", "updated_at")
    VALUES (
      ${code}, 
      ${facilityId}, 
      ST_SetSRID(ST_GeomFromGeoJSON(${JSON.stringify(zone)}), 4326),
      NOW(),
      NOW()
    )
    RETURNING 
      id, 
      code, 
      "facility_id" AS "facilityId", 
      "created_at" AS "createdAt", 
      "updated_at" AS "updatedAt"
  `

  if (barangayIds) {
    await fastify.prisma.barangay.updateMany({
      where: { id: { in: barangayIds } },
      data: { sectorId: sector.id }
    })
  }

  return sector
}

export async function getSectorById(fastify: FastifyInstance, id: number) {
  const sector = await fastify.prisma.sector.findUnique({
    where: { id },
    include: {
      barangays: true,
      localBranch: true,
    },
  });

  if (!sector) {
    throw new Error('SectorNotFound');
  }

  return sector;
}

export async function updateSector(
  fastify: FastifyInstance,
  id: number,
  data: UpdateSectorBody
) {
  const { code, facilityId, zone, barangayIds } = data

  if (zone) {
    await fastify.prisma.$executeRaw`
      UPDATE "sectors"
      SET 
        code = COALESCE(${code ?? null}, code),
        local_branch_id = COALESCE(${facilityId ?? null}, local_branch_id),
        zone = ST_SetSRID(ST_GeomFromGeoJSON(${JSON.stringify(zone)}), 4326),
        updated_at = NOW()
      WHERE id = ${id}
    `
  } else {
    await fastify.prisma.sector.update({
      where: { id },
      data: {
        ...(code && { code }),
        ...(facilityId && { facilityId }),
      },
    })
  }

  const [updatedSector] = await fastify.prisma.$queryRaw<any[]>`
    SELECT 
      id, 
      code, 
      "local_branch_id" AS "facilityId", 
      "created_at" AS "createdAt", 
      "updated_at" AS "updatedAt"
    FROM "sectors"
    WHERE id = ${id}
  `

  if (barangayIds) {
    await fastify.prisma.barangay.updateMany({
      where: { id: { in: barangayIds } },
      data: { sectorId: updatedSector.id }
    })
  }

  return updatedSector
}

export async function deleteSector(
  fastify: FastifyInstance,
  id: number
) {

  return await fastify.prisma.sector.delete({
    where: { id },
  })
}