import { ShipmentStatus } from "@prisma/client"
import { generateEventDescription } from "../../src/modules/tracking-logs/logisticsEventDictionary.js"
import { FastifyInstance } from "fastify"

export async function createTrackingLog(fastify: FastifyInstance, parcelId: number, status: ShipmentStatus = ShipmentStatus.PendingPickup) {
  // const description = generateEventDescription({ status:  })

  const parcel = await fastify.prisma.parcel.update({
    where: { id: parcelId },
    data: {
      status
    }
  })

  return await fastify.prisma.trackingLog.create({
    data: {
      parcelId: parcel.id,
      status,
      description: 'sample',
    }
  })
}
