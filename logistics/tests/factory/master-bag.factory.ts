import { MasterBagStatus } from "@prisma/client";
import { FastifyInstance } from "fastify";
import { generateMasterBagCode } from "../../src/modules/fulfillment-sortation/services/master-bag.service.js";
import { createFacility } from "./facility.factory.js";
import { createFleetTransport } from "./fleet-transport.factory.js";
import { createSortingBatch } from "./sorting-batch.factory.js";

export async function createMasterBag(
  fastify: FastifyInstance,
  overrides?: Record<string, any>
) {
  let currentFacilityId = overrides?.currentFacilityId;
  if (!currentFacilityId) {
    const facility = await createFacility(fastify);
    currentFacilityId = facility.id;
  }

  let nextFacilityId = overrides?.nextFacilityId;
  if (!nextFacilityId) {
    const facility = await createFacility(fastify);
    nextFacilityId = facility.id;
  }

  let sortingBatchId = overrides?.sortingBatchId;
  if (!sortingBatchId) {
    const batch = await createSortingBatch(fastify, { facilityId: currentFacilityId });
    sortingBatchId = batch.id;
  }

  let courierScheduleId = overrides?.courierScheduleId;
  if (!courierScheduleId) {
    const schedule = await createFleetTransport(fastify);
    courierScheduleId = schedule.id;
  }

  const bagCode = await generateMasterBagCode(fastify, currentFacilityId);

  return await fastify.prisma.masterBag.create({
    data: {
      code: bagCode,
      sortingBatchId,
      courierScheduleId,
      currentFacilityId,
      nextFacilityId,
      totalWeight: 2000,
      totalCbm: 0.02,
      totalParcels: 5,
      status: MasterBagStatus.Open,
      ...overrides,
    },
  });
}