import { FastifyInstance } from "fastify";
import { SortationBatchStatus, MasterBagStatus } from "@prisma/client";
import { createFacility } from "./facility.factory.js";
import { createCourierSchedule } from "./vehicles.factory.js";

export async function createSortingBatch(
  fastify: FastifyInstance, 
  overrides?: Record<string, any>
) {
  let facilityId = overrides?.facilityId;
  if (!facilityId) {
    const facility = await createFacility(fastify);
    facilityId = facility.id;
  }

  const randomSuffix = Math.floor(Math.random() * 10000);

  return await fastify.prisma.sortationBatch.create({
    data: {
      code: `BATCH-${randomSuffix}`,
      facilityId,
      status: SortationBatchStatus.Scheduled,
      ...overrides,
    },
  });
}

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

  let courierScheduleId = overrides?.courierScheduleId;
  if (!courierScheduleId) {
    const schedule = await createCourierSchedule(fastify);
    courierScheduleId = schedule.id;
  }

  let sortingBatchId = overrides?.sortingBatchId;
  if (!sortingBatchId) {
    const batch = await createSortingBatch(fastify, { facilityId: currentFacilityId });
    sortingBatchId = batch.id;
  }

  const randomSuffix = Math.floor(Math.random() * 10000);

  return await fastify.prisma.masterBag.create({
    data: {
      code: `BAG-${randomSuffix}`,
      courierScheduleId,
      sortingBatchId,
      currentFacilityId,
      nextFacilityId,
      totalWeight: 2000,
      totalParcels: 5,
      status: MasterBagStatus.Open,
      ...overrides,
    },
  });
}

export async function createFacilityChute(
  fastify: FastifyInstance, 
  overrides?: Record<string, any>
) {
  let facilityId = overrides?.facilityId;
  if (!facilityId) {
    const facility = await createFacility(fastify);
    facilityId = facility.id;
  }

  let destinationFacilityId = overrides?.destinationFacilityId;
  if (!destinationFacilityId) {
    const facility = await createFacility(fastify);
    destinationFacilityId = facility.id;
  }

  const randomSuffix = Math.floor(Math.random() * 10000);

  return await fastify.prisma.facilityChute.create({
    data: {
      code: `CHUTE-${randomSuffix}`,
      facilityId,
      destinationFacilityId,
      isActive: true,
      ...overrides,
    },
  });
}