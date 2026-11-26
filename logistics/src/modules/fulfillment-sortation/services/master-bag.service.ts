import { FastifyInstance } from "fastify";
import { CreateMasterBagBody, UpdateMasterBagBody } from "../schemas/master-bag.schema.js";
import parseId from "#commons/utils/id-parser.js";
import { MasterBagStatus } from "@prisma/client";

// [TARGET_FACILITY_CODE]-[YYYYMMDD]-[SHIFT_CODE]-[SEQUENCE]
export async function generateMasterBagCode(
  fastify: FastifyInstance,
  facilityId: number
): Promise<string> {
  const facility = await fastify.prisma.facility.findUniqueOrThrow({
    where: { id: facilityId },
    select: { code: true }
  });

  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;

  const prefix = `${facility.code}-${dateStr}-BAG`;

  const countToday = await fastify.prisma.masterBag.count({
    where: {
      code: {
        startsWith: prefix,
      },
    },
  });

  const sequence = String(countToday + 1).padStart(3, '0');

  return `${prefix}-${sequence}`;
}

export async function getDashboardData(fastify: FastifyInstance) {
  const masterBags = await fastify.prisma.masterBag.findMany({
    include: {
      currentFacility: true,
      nextFacility: true,
      sortingBatch: true,
      parcels: true
    },
    orderBy: { createdAt: 'desc' }
  });

  const masterBagStatuses = Object.values(MasterBagStatus)

  return {
    masterBags,
    masterBagStatuses
  }
}

export async function getMasterBags(fastify: FastifyInstance) {
  return await fastify.prisma.masterBag.findMany({
    include: {
      currentFacility: true,
      nextFacility: true,
      sortingBatch: true,
      parcels: true
    },
    orderBy: { createdAt: 'desc' }
  });
}

export async function createMasterBag(
  fastify: FastifyInstance,
  data: CreateMasterBagBody
) {
  const {
    fleetTransportId,
    sortingBatchId,
    currentFacilityId,
    nextFacilityId,
    totalWeight,
    totalCbm,
    totalParcels,
    status
  } = data

  const code = await generateMasterBagCode(fastify, nextFacilityId)

  return await fastify.prisma.masterBag.create({
    data: {
      code,
      fleetTransportId,
      sortingBatchId,
      currentFacilityId,
      nextFacilityId,
      totalWeight,
      totalCbm,
      totalParcels,
      status: status ? (status as MasterBagStatus) : undefined,
    },
  })
}

export async function getMasterBagById(fastify: FastifyInstance, idParam: string) {
  const id = parseId(idParam);
  return await fastify.prisma.masterBag.findUniqueOrThrow({
    where: { id },
    include: {
      currentFacility: true,
      nextFacility: true,
      sortingBatch: true,
      parcels: true,
      logs: true
    }
  });
}

export async function getOrCreateActiveMasterBag(
  fastify: FastifyInstance,
  sortingBatchId: number,
  currentFacilityId: number,
  nextFacilityId: number
) {
  let masterBag = await fastify.prisma.masterBag.findFirst({
    where: {
      status: MasterBagStatus.Open,
      sortingBatchId,
      currentFacilityId,
      nextFacilityId,
    }
  });

  if (!masterBag) {
    const code = await generateMasterBagCode(fastify, currentFacilityId);

    masterBag = await fastify.prisma.masterBag.create({
      data: {
        code,
        sortingBatchId,
        currentFacilityId,
        nextFacilityId,
        status: MasterBagStatus.Open,
      }
    });
  }

  return masterBag;
}

export async function updateMasterBag(
  fastify: FastifyInstance,
  idParam: string,
  data: UpdateMasterBagBody
) {
  const id = parseId(idParam)
  const {
    fleetTransportId,
    sortingBatchId,
    currentFacilityId,
    nextFacilityId,
    totalWeight,
    totalParcels,
    status,
    sealedAt
  } = data

  return await fastify.prisma.masterBag.update({
    where: { id },
    data: {
      ...(fleetTransportId && { fleetTransportId }),
      ...(sortingBatchId && { sortingBatchId }),
      ...(currentFacilityId && { currentFacilityId }),
      ...(nextFacilityId && { nextFacilityId }),
      ...(totalWeight !== undefined && { totalWeight }),
      ...(totalParcels !== undefined && { totalParcels }),
      ...(status && { status: status as MasterBagStatus }),
      ...(sealedAt !== undefined && { sealedAt: sealedAt ? new Date(sealedAt) : null }),
    },
  })
}

export async function deleteMasterBag(
  fastify: FastifyInstance,
  idParam: string
) {
  const id = parseId(idParam)

  return await fastify.prisma.masterBag.delete({
    where: { id },
  })
}