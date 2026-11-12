import { FastifyInstance } from "fastify";
import { UpdateBody } from "./schema.js";
import parseId from "#commons/utils/id-parser.js";

export async function create(fastify: FastifyInstance, data: any) {
  const { masterBagIds, ...scheduleData } = data;

  return await fastify.prisma.$transaction(async (tx) => {
    const fleetTransport = await tx.fleetTransport.create({
      data: scheduleData,
    })

    if (masterBagIds && masterBagIds.length > 0) {
      await tx.masterBag.updateMany({
        where: { id: { in: masterBagIds } },
        data: { courierScheduleId: fleetTransport.id }
      })
    }

    return fleetTransport;
  })
}

export async function update(
  fastify: FastifyInstance,
  idParam: string,
  data: UpdateBody
) {
  const id = parseId(idParam)
  const { courierId, vehicleId, networkLegId, scheduledTime } = data

  return await fastify.prisma.fleetTransport.update({
    where: { id },
    data: {
      ...(courierId !== undefined && { courierId: courierId ?? null }),
      ...(vehicleId && { vehicleId }),
      ...(networkLegId && { networkLegId }),
      ...(scheduledTime && { scheduledTime }),
    },
  })
}

export async function destroy(
  fastify: FastifyInstance,
  idParam: string
) {
  const id = parseId(idParam)

  return await fastify.prisma.fleetTransport.delete({
    where: { id },
  })
}