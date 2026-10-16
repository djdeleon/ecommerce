import { FastifyInstance } from "fastify";
import { CreateSortationBatchBody, UpdateSortationBatchBody } from "../schemas/sorting-batch.schema.js";
import parseId from "#commons/utils/id-parser.js";
import { SortationBatchStatus } from "@prisma/client";

export async function createSortingBatch(
  fastify: FastifyInstance, 
  data: CreateSortationBatchBody
) {
  const { code, startTime, endTime, facilityId, status } = data

  return await fastify.prisma.sortationBatch.create({
    data: {
      code,
      startTime: startTime ? new Date(startTime) : undefined,
      endTime: endTime ? new Date(endTime) : undefined,
      facilityId,
      status: status ? (status as SortationBatchStatus) : undefined,
    },
  })
}

export async function updateSortingBatch(
  fastify: FastifyInstance,
  idParam: string,
  data: UpdateSortationBatchBody
) {
  const id = parseId(idParam)
  const { code, startTime, endTime, facilityId, status, completedAt } = data

  return await fastify.prisma.sortationBatch.update({
    where: { id },
    data: {
      ...(code && { code }),
      ...(startTime !== undefined && { startTime: startTime ? new Date(startTime) : null }),
      ...(endTime !== undefined && { endTime: endTime ? new Date(endTime) : null }),
      ...(facilityId && { facilityId }),
      ...(status && { status: status as SortationBatchStatus }),
      ...(completedAt !== undefined && { completedAt: completedAt ? new Date(completedAt) : null }),
    },
  })
}

export async function deleteSortingBatch(
  fastify: FastifyInstance,
  idParam: string
) {
  const id = parseId(idParam)

  return await fastify.prisma.sortationBatch.delete({
    where: { id },
  })
}