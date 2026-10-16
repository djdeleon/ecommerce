import { FastifyInstance } from "fastify";
import { CreateSectorBody, UpdateSectorBody } from "./schema.js";
import parseId from "#commons/utils/id-parser.js";

export async function createSector(
  fastify: FastifyInstance, 
  data: CreateSectorBody
) {
  const { code, localBranchId, zone } = data

  const [sector] = await fastify.prisma.$queryRaw<any[]>`
    INSERT INTO "sectors" ("code", "local_branch_id", "zone", "created_at", "updated_at")
    VALUES (
      ${code}, 
      ${localBranchId}, 
      ST_SetSRID(ST_GeomFromGeoJSON(${JSON.stringify(zone)}), 4326),
      NOW(),
      NOW()
    )
    RETURNING 
      id, 
      code, 
      "local_branch_id" AS "localBranchId", 
      "created_at" AS "createdAt", 
      "updated_at" AS "updatedAt"
  `

  return sector
}

export async function updateSector(
  fastify: FastifyInstance,
  idParam: string,
  data: UpdateSectorBody
) {
  const { code, localBranchId, zone } = data
  const id = parseId(idParam)

  if (zone) {
    await fastify.prisma.$executeRaw`
      UPDATE "sectors"
      SET 
        code = COALESCE(${code ?? null}, code),
        local_branch_id = COALESCE(${localBranchId ?? null}, local_branch_id),
        zone = ST_SetSRID(ST_GeomFromGeoJSON(${JSON.stringify(zone)}), 4326),
        updated_at = NOW()
      WHERE id = ${id}
    `
  } else {
    await fastify.prisma.sector.update({
      where: { id },
      data: {
        ...(code && { code }),
        ...(localBranchId && { localBranchId }),
      },
    })
  }

  const [updatedSector] = await fastify.prisma.$queryRaw<any[]>`
    SELECT 
      id, 
      code, 
      "local_branch_id" AS "localBranchId", 
      "created_at" AS "createdAt", 
      "updated_at" AS "updatedAt"
    FROM "sectors"
    WHERE id = ${id}
  `

  return updatedSector
}

export async function deleteSector(
  fastify: FastifyInstance,
  idParam: string
) {
  const id = parseId(idParam)

  return await fastify.prisma.sector.delete({
    where: { id },
  })
}