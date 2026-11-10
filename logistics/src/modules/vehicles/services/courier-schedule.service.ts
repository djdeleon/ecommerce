import { FastifyInstance } from "fastify";
import { UpdateCourierScheduleBody } from "../schemas/courier-schedule.schema.js";
import parseId from "#commons/utils/id-parser.js";

export async function createCourierSchedule(fastify: FastifyInstance, data: any) {
  const { masterBagIds, ...scheduleData } = data;

  return await fastify.prisma.$transaction(async (tx) => {
    const courierSchedule = await tx.courierSchedule.create({
      data: scheduleData,
    })

    if (masterBagIds && masterBagIds.length > 0) {
      await tx.masterBag.updateMany({
        where: { id: { in: masterBagIds } },
        data: { courierScheduleId: courierSchedule.id }
      })
    }

    return courierSchedule;
  })
}

export async function updateCourierSchedule(
  fastify: FastifyInstance,
  idParam: string,
  data: UpdateCourierScheduleBody
) {
  const id = parseId(idParam)
  const { courierId, vehicleId, networkLegId, scheduledTime } = data

  return await fastify.prisma.courierSchedule.update({
    where: { id },
    data: {
      ...(courierId !== undefined && { courierId: courierId ?? null }),
      ...(vehicleId && { vehicleId }),
      ...(networkLegId && { networkLegId }),
      ...(scheduledTime && { scheduledTime }),
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