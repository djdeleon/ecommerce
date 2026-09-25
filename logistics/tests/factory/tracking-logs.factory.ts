import { ShipmentStatus } from "@prisma/client"
import { generateEventDescription } from "../../src/modules/tracking-logs/logisticsEventDictionary.js"
import { prisma } from "../../src/commons/plugins/prisma.js"

export async function createTrackingLog(parcelId: number, status: ShipmentStatus = ShipmentStatus.PendingPickup) {
  const description = generateEventDescription({ status })

  const parcel = await prisma.parcel.update({
    where: { id: parcelId },
    data: {
      status
    }
  })

  return await prisma.trackingLog.create({
    data: {
      parcelId: parcel.id,
      status,
      description: description,
    }
  })
}
