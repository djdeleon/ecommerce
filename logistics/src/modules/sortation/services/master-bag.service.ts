import { FastifyInstance } from "fastify";
import { CreateMasterBagBody, UpdateMasterBagBody } from "../schemas/master-bag.schema.js";
import parseId from "#commons/utils/id-parser.js";
import { MasterBagStatus } from "@prisma/client";

export async function createMasterBag(
  fastify: FastifyInstance, 
  data: CreateMasterBagBody
) {
  const { 
    code, 
    courierScheduleId, 
    sortingBatchId, 
    currentFacilityId, 
    nextFacilityId, 
    totalWeight, 
    totalParcels, 
    status 
  } = data

  return await fastify.prisma.masterBag.create({
    data: {
      code,
      courierScheduleId,
      sortingBatchId,
      currentFacilityId,
      nextFacilityId,
      totalWeight,
      totalParcels,
      status: status ? (status as MasterBagStatus) : undefined,
    },
  })
}

export async function updateMasterBag(
  fastify: FastifyInstance,
  idParam: string,
  data: UpdateMasterBagBody
) {
  const id = parseId(idParam)
  const { 
    code, 
    courierScheduleId, 
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
      ...(code && { code }),
      ...(courierScheduleId && { courierScheduleId }),
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