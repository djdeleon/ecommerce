import { prisma } from "#commons/database/prisma.js";
import { PrismaClient } from "@prisma/client/extension";
import crypto from "crypto"
import { FastifyInstance } from "fastify";

interface GenerateTrackingNumberData {
  apiKey: string;
  size: number;
}

export async function generateTrackingNumbers(data: GenerateTrackingNumberData) {
  const { id: clientId } = await prisma.client.findUniqueOrThrow({
    where: { apiKey: data.apiKey },
    select: { id: true }
  })
  const trackingNumbers = [];
  const CHUNK_SIZE = 1000;

  for (let i = 0; i < data.size; i++) {
    const prefix = 'FSTFY'
    const body = crypto.randomBytes(5).toString('hex').toUpperCase()
    const suffix = 'PH'
    const trackingNumber = `${prefix}${body}${suffix}`

    trackingNumbers.push({
      clientId,
      number: trackingNumber
    })

    if (trackingNumbers.length > CHUNK_SIZE) {
      await prisma.trackingNumber.createMany({
        data: trackingNumbers,
        skipDuplicates: true
      })

      trackingNumbers.length = 0
    }
  }

  if (trackingNumbers.length > 0) {
    await prisma.trackingNumber.createMany({
      data: trackingNumbers,
      skipDuplicates: true
    })
  }

  return await prisma.trackingNumber.findMany({
    where: { clientId },
    select: { number: true }
  })
}

export async function activateTrackingNumber(fastify: FastifyInstance, clientId: number, trackingNumber: string) {
  const existingTrackingNumber = await fastify.prisma.trackingNumber.findUnique({
    where: { number: trackingNumber }
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

  await fastify.prisma.trackingNumber.update({
    where: { id: existingTrackingNumber.id },
    data: {
      isAssigned: true,
      assignedAt: new Date()
    }
  })
}