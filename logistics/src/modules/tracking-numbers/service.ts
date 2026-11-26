import { prisma } from "#commons/database/prisma.js";
import { Prisma } from "@prisma/client";
import crypto from "crypto"
import { FastifyInstance } from "fastify";

interface GenerateTrackingNumberData {
  apiKey?: string;
  size: number;
}

export async function generateTrackingNumbers(
  db: Prisma.TransactionClient | typeof prisma = prisma,
  data: GenerateTrackingNumberData,
) {
  let clientId: number | undefined = undefined;

  if (data.apiKey) {
    const client = await db.client.findUnique({
      where: { apiKey: data.apiKey },
      select: { id: true }
    });

    if (client) {
      clientId = client.id;
    }
  }

  const trackingNumbers: { number: string; clientId?: number }[] = [];
  const generatedNumbers: string[] = [];
  const CHUNK_SIZE = 1000;

  for (let i = 0; i < data.size; i++) {
    const prefix = 'FSTFY';
    const body = crypto.randomBytes(5).toString('hex').toUpperCase();
    const suffix = 'PH';
    const trackingNumber = `${prefix}${body}${suffix}`;

    const row: { number: string; clientId?: number } = {
      number: trackingNumber,
    };

    if (clientId !== undefined) {
      row.clientId = clientId;
    }

    trackingNumbers.push(row);
    generatedNumbers.push(trackingNumber);

    if (trackingNumbers.length >= CHUNK_SIZE) {
      await db.trackingNumber.createMany({
        data: trackingNumbers,
        skipDuplicates: true
      });
      trackingNumbers.length = 0;
    }
  }

  if (trackingNumbers.length > 0) {
    await db.trackingNumber.createMany({
      data: trackingNumbers,
      skipDuplicates: true
    });
  }

  return generatedNumbers.map(number => ({ number }));
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