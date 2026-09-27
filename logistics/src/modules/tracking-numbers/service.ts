import { prisma } from "#commons/database/prisma.js";
import { PrismaClient } from "@prisma/client/extension";
import crypto from "crypto"

interface GenerateTrackingNumberData {
  clientId: number;
  size: number;
}

export async function generateTrackingNumbers(data: GenerateTrackingNumberData) {
  const trackingNumbers = [];
  const CHUNK_SIZE = 1000;

  for (let i = 0; i < data.size; i++) {
    const prefix = 'FSTFY'
    const body = crypto.randomBytes(5).toString('hex').toUpperCase()
    const suffix = 'PH'
    const trackingNumber = `${prefix}${body}${suffix}`

    trackingNumbers.push({
      clientId: data.clientId,
      trackingNumber
    })

    if (trackingNumbers.length > CHUNK_SIZE) {
      await prisma.trackingNumberPool.createMany({
        data: trackingNumbers,
        skipDuplicates: true
      })

      trackingNumbers.length = 0
    }
  }

  if (trackingNumbers.length > 0) {
    await prisma.trackingNumberPool.createMany({
      data: trackingNumbers,
      skipDuplicates: true
    })
  }

  return await prisma.trackingNumberPool.findMany({
    where: { clientId: data.clientId }
  })
}

export async function activateTrackingNumber(clientId: number, trackingNumber: string, prisma: PrismaClient) {
  const existingTrackingNumber = await prisma.trackingNumberPool.findUnique({
    where: { trackingNumber }
  })

  if (!existingTrackingNumber) {
    throw new Error("TrackingNumberDoesNotExist")
  }

  if (existingTrackingNumber.clientId !== clientId) {
    throw new Error("TrackingNumberAndClientMismatched")
  }

  if (existingTrackingNumber.isAssigned) {
    throw new Error("TrackingNumberIsAlreadyUsed")
  }

  await prisma.trackingNumberPool.update({
    where: { id: existingTrackingNumber.id },
    data: {
      isAssigned: true,
      assignedAt: new Date()
    }
  })
}