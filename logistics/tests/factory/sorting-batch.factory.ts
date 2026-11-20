import { FastifyInstance } from "fastify";
import { generateBatchCode } from "../../src/modules/fulfillment-sortation/services/sorting-batch.service.js";
import { createFacility } from "./facility.factory.js";
import { SortingBatchStatus } from "@prisma/client";

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

  if (shift === 'NIGHT') {
    // Night Peak Shift: 6:00 PM to 4:00 AM (Cut-off at 11:00 PM)
    startTime = new Date("1970-01-01T18:00:00Z");
    endTime = new Date("1970-01-01T04:00:00Z");
    cutOffTime = new Date("1970-01-01T23:00:00Z");
  } else {
    // Morning Sort Shift: 9:00 AM to 2:00 PM (Cut-off at 12:00 PM)
    startTime = new Date("1970-01-01T09:00:00Z");
    endTime = new Date("1970-01-01T14:00:00Z");
    cutOffTime = new Date("1970-01-01T12:00:00Z");
  }

  // Destructure shift out of overrides so it doesn't get sent to Prisma
  const { shift: _shift, ...restOverrides } = overrides || {};

  return await fastify.prisma.sortingBatch.create({
    data: {
      code: batchCode,
      facilityId,
      status: SortingBatchStatus.Scheduled,
      startTime,
      endTime,
      cutOffTime,
      ...restOverrides,
    },
  });
}