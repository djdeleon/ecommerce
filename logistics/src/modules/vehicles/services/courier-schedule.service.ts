import { FastifyInstance } from "fastify";
import { CreateCourierScheduleBody, UpdateCourierScheduleBody } from "../schemas/courier-schedule.schema.js";
import parseId from "#commons/utils/id-parser.js";

export async function createCourierSchedule(
  fastify: FastifyInstance, 
  data: CreateCourierScheduleBody
) {
  const { courierId, physicalVehicleId, networkLegId } = data

  return await fastify.prisma.courierSchedule.create({
    data: {
      courierId: courierId ?? null,
      physicalVehicleId,
      networkLegId,
    },
  })
}

export async function updateCourierSchedule(
  fastify: FastifyInstance,
  idParam: string,
  data: UpdateCourierScheduleBody
) {
  const id = parseId(idParam)
  const { courierId, physicalVehicleId, networkLegId } = data

  return await fastify.prisma.courierSchedule.update({
    where: { id },
    data: {
      ...(courierId !== undefined && { courierId: courierId ?? null }),
      ...(physicalVehicleId && { physicalVehicleId }),
      ...(networkLegId && { networkLegId }),
    },
  })
}

export async function deleteCourierSchedule(
  fastify: FastifyInstance,
  idParam: string
) {
  const id = parseId(idParam)

  return await fastify.prisma.courierSchedule.delete({
    where: { id },
  })
}