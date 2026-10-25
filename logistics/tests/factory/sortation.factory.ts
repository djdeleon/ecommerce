import { FastifyInstance } from "fastify";
import { SortationBatchStatus, MasterBagStatus } from "@prisma/client";
import { createFacility } from "./facility.factory.js";
import { createCourierSchedule } from "./vehicles.factory.js";
import { generateBatchCode } from "../../src/modules/sortation/services/sorting-batch.service.js";
import { generateMasterBagCode } from "../../src/modules/sortation/services/master-bag.service.js";

export async function createSortingBatch(
  fastify: FastifyInstance,
  overrides?: Record<string, any> & { shift?: 'NIGHT' | 'MORNING' }
) {
  let facilityId = overrides?.facilityId;
  if (!facilityId) {
    const facility = await createFacility(fastify);
    facilityId = facility.id;
  }

  const shift = overrides?.shift || 'NIGHT'; // Default to Night Peak Shift
  const batchCode = await generateBatchCode(fastify, facilityId, shift);

  // Define shift windows based on enterprise logistics rules
  let startTime: Date;
  let endTime: Date;
  let cutOffTime: Date;
  let shiftCode: string;

  if (shift === 'NIGHT') {
    // Night Peak Shift: 6:00 PM to 4:00 AM (Cut-off at 11:00 PM)
    startTime = new Date("1970-01-01T18:00:00Z");
    endTime = new Date("1970-01-01T04:00:00Z"); // Next day behavior handled by DB/time logic
    cutOffTime = new Date("1970-01-01T23:00:00Z");
    shiftCode = 'NIGHT';
  } else {
    // Morning Sort Shift: 9:00 AM to 2:00 PM (Cut-off at 12:00 PM)
    startTime = new Date("1970-01-01T09:00:00Z");
    endTime = new Date("1970-01-01T14:00:00Z");
    cutOffTime = new Date("1970-01-01T12:00:00Z");
    shiftCode = 'MORNING';
  }

  return await fastify.prisma.sortationBatch.create({
    data: {
      code: batchCode,
      facilityId,
      status: SortationBatchStatus.Scheduled,
      startTime,
      endTime,
      cutOffTime,
      ...overrides, // Allows overriding any specific property directly
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

  let sortingBatchId = overrides?.sortingBatchId;
  if (!sortingBatchId) {
    const batch = await createSortingBatch(fastify, { facilityId: currentFacilityId });
    sortingBatchId = batch.id;
  }

  let courierScheduleId = overrides?.courierScheduleId;
  if (!courierScheduleId) {
    const schedule = await createCourierSchedule(fastify);
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