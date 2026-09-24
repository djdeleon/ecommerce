import { ShipmentStatus } from "@prisma/client"
import { generateEventDescription } from "../../src/logisticsEventDictionary.js"
import { prisma } from "../../src/prisma.js"

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
