import { generateEventDescription } from "./logisticsEventDictionary.js";
import { ShipmentStatus } from "@prisma/client";
import { PrismaClient } from "@prisma/client/extension";

interface CreateTrackingLogData {
  parcelId: number;
  status: ShipmentStatus
}

export async function createTrackingLog(prisma: PrismaClient, data: CreateTrackingLogData) {
  const description = generateEventDescription({
    status: data.status
  })

    await prisma.trackingLog.create({
      data: {
        parcelId: data.parcelId,
        status: data.status,
        description,
      }
    })
}