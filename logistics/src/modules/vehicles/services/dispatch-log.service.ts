import { FastifyInstance } from "fastify";
import { CreateDispatchLogBody, UpdateDispatchLogBody } from "../schemas/dispatch-log.schema.js";
import parseId from "#commons/utils/id-parser.js";

export async function createDispatchLog(
  fastify: FastifyInstance, 
  data: CreateDispatchLogBody
) {
  const { assignedCourierId, originFacilityId, dispatchedAt, arrivedAt } = data

  return await fastify.prisma.dispatchLog.create({
    data: {
      assignedCourierId,
      originFacilityId: originFacilityId ?? null,
      dispatchedAt: new Date(dispatchedAt),
      arrivedAt: arrivedAt ? new Date(arrivedAt) : undefined,
    },
  })
}

export async function updateDispatchLog(
  fastify: FastifyInstance,
  idParam: string,
  data: UpdateDispatchLogBody
) {
  const id = parseId(idParam)
  const { assignedCourierId, originFacilityId, dispatchedAt, arrivedAt } = data

  return await fastify.prisma.dispatchLog.update({
    where: { id },
    data: {
      ...(assignedCourierId && { assignedCourierId }),
      ...(originFacilityId !== undefined && { originFacilityId: originFacilityId ?? null }),
      ...(dispatchedAt && { dispatchedAt: new Date(dispatchedAt) }),
      ...(arrivedAt !== undefined && { arrivedAt: arrivedAt ? new Date(arrivedAt) : null }),
    },
  })
}

export async function deleteDispatchLog(
  fastify: FastifyInstance,
  idParam: string
) {
  const id = parseId(idParam)

  return await fastify.prisma.dispatchLog.delete({
    where: { id },
  })
}