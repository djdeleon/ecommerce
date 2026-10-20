import { FacilityType, ShipmentStatus } from "@prisma/client";
import { createCourier, createFacility } from "#factory";
import { FastifyInstance } from "fastify";
import { createSector } from "./sector.factory.js";

export async function createParcel(fastify: FastifyInstance, overrides = {}) {
  const randomSuffix = Math.floor(Math.random() * 1000000);

  const origin = await createFacility(fastify, {
    name: `Origin Mega Hub ${randomSuffix}`
  })
  const originSector = await createSector(fastify, {
    localBranchId: origin.id
  })
  const destination = await createFacility(fastify, {
    name: `Destination Distribution Center ${randomSuffix}`,
    type: FacilityType.DistributionCenter,
  })
  const destinationSector = await createSector(fastify, {
    localBranchId: destination.id
  })

  const courier = await createCourier(fastify, { currentFacilityId: origin.id });

  const store = await fastify.prisma.store.create({
    data: {
      name: `Store ${randomSuffix}`,
      contactNumber: "09225325754",
      address: "Bulacan 123 Main St.",
    }
  })

  await fastify.prisma.$executeRaw`
    UPDATE stores
    SET location = ST_SetSRID(ST_MakePoint(${14.22}, ${123.423}), 4326)
    WHERE id = ${store.id}
  `

  const trackingNumber = `TRK-${Date.now()}-${randomSuffix}`;
  const externalOrderId = `EXT-${randomSuffix}`;

  // Ensure a client and tracking pool entry exist to satisfy the foreign key constraint
  const client = await fastify.prisma.client.upsert({
    where: { name: `Default Client ${randomSuffix}` },
    update: {},
    create: {
      name: `Default Client ${randomSuffix}`,
      apiKey: `key-${randomSuffix}`,
      apiSecret: `secret-${randomSuffix}`,
      webhookUrl: "https://example.com/webhook",
      webhookSecret: "wh-secret",
    },
  });

  await fastify.prisma.trackingNumberPool.create({
    data: {
      trackingNumber,
      clientId: client.id,
      isAssigned: true,
      assignedAt: new Date(),
    },
  });

  const parcel = await fastify.prisma.parcel.create({
    data: {
      trackingNumber,
      externalOrderId,
      weightGrams: 1500,
      lengthCm: 20,
      heightCm: 10,
      widthCm: 15,
      calculatedCbm: 0.003,
      declaredValue: 500.00,
      shippingServiceType: "R",
      originSectorId: originSector.id,
      currentSectorId: null,
      destinationSectorId: destinationSector.id,
      originFacilityId: origin.id,
      destinationFacilityId: destination.id,
      currentFacilityId: origin.id,
      sortingCodeCache: `HUB-BUL-SKY-05`,
      routingPipelineCache: `BUL-NL`,
      storeId: store.id,
      customerName: "Doe John",
      customerAddress: "Marilao San Pablo 123 St.",
      customerPhone: "09244562453",
      assignedCourierId: courier.id,
      status: ShipmentStatus.PendingPickup,
      ...overrides,
    },
  });

  await fastify.prisma.$executeRaw`
    UPDATE parcels
    SET customer_location = ST_SetSRID(ST_MakePoint(${14.22}, ${123.423}), 4326)
    WHERE id = ${parcel.id}
  `

  return parcel
}