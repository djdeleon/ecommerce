import { FastifyInstance } from "fastify";
import { createFacility } from "./facility.factory.js";

export async function createSector(fastify: FastifyInstance, overrides = {}) {
  const randomSuffix = Math.floor(Math.random() * 100);
  
  let localBranchId = (overrides as any).localBranchId;
  if (!localBranchId) {
    const facility = await createFacility(fastify);
    localBranchId = facility.id;
  }

  const code = (overrides as any).code ?? `R03-BUL-SJD-${randomSuffix.toString()}`;

  const zone = (overrides as any).zone ?? {
    type: "Polygon",
    coordinates: [
      [
        [120.98, 14.75],
        [120.99, 14.75],
        [120.99, 14.76],
        [120.98, 14.76],
        [120.98, 14.75]
      ]
    ]
  };

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
  `;

  return sector;
}