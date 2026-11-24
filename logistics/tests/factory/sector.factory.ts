import { FastifyInstance } from "fastify";
import { createFacility } from "./facility.factory.js";
import { createSector as createSectorService } from "../../src/modules/sectors/service.js";

export async function createSector(fastify: FastifyInstance, overrides: any = {}) {
  const randomSuffix = Math.floor(Math.random() * 100);

  let facilityId = overrides.facilityId;
  if (!facilityId) {
    const facility = await createFacility(fastify);
    facilityId = facility.id;
  }

  const code = overrides.code ?? `R03-BUL-SJD-${randomSuffix.toString()}`;

  const zone = overrides.zone ?? {
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

  return await createSectorService(fastify, {
    code,
    facilityId,
    zone,
    barangayIds: overrides.barangayIds
  })
}