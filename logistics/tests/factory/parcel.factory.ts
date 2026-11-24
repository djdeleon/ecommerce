import { FacilityType, ParcelStatus } from "@prisma/client";
import { createCourier, createFacility } from "#factory";
import { FastifyInstance } from "fastify";
import { createSector } from "./sector.factory.js";

export async function createParcel(fastify: FastifyInstance, overrides: any = {}) {
  const randomSuffix = Math.floor(Math.random() * 1000000);

  // Setup default relations if not provided
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

  // Seed default Barangay for store/recipient foreign keys
  const region = await fastify.prisma.region.upsert({
    where: { id: "1300000000" },
    update: {},
    create: { id: "1300000000", name: "NCR", code: "NCR" },
  });
  const city = await fastify.prisma.city.upsert({
    where: { id: "1380600000" },
    update: {},
    create: { id: "1380600000", name: "Manila", code: "MNL", provinceId: null },
  });
  const brgy = await fastify.prisma.barangay.upsert({
    where: { id: "1380601148" },
    update: {},
    create: { id: "1380601148", name: "Barangay 148", code: "NCR-MNL-148", cityId: city.id },
  });

  const { courier } = await createCourier(fastify, { currentFacilityId: origin.id });

  // Use provided clientId or fallback to creating a "Default Client"
  let targetClientId = overrides.clientId;

  if (!targetClientId) {
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
    targetClientId = client.id;
  }

  // Create Store with mandatory externalFacilityId and barangayId
  const store = await fastify.prisma.store.create({
    data: {
      clientId: targetClientId,
      externalFacilityId: randomSuffix,
      name: `Store ${randomSuffix}`,
      contactNumber: "09225325754",
      streetAddress: "Bulacan 123 Main St.",
      barangayId: brgy.id,
    }
  });

  await fastify.prisma.$executeRaw`
    UPDATE stores
    SET location = ST_SetSRID(ST_MakePoint(${14.22}, ${123.423}), 4326)
    WHERE id = ${store.id}
  `;

  const trackingNumber = `TRK-${Date.now()}-${randomSuffix}`;
  const externalOrderId = `EXT-${randomSuffix}`;

  await fastify.prisma.trackingNumber.create({
    data: {
      number: trackingNumber,
      clientId: targetClientId,
      isAssigned: true,
      assignedAt: new Date(),
    },
  });

  const { clientId, parcelAmount, ...parcelOverrides } = overrides;
  const initialStatus = parcelOverrides.status || ParcelStatus.PendingPickup;

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
      recipientName: "Doe John",
      recipientAddress: "Marilao San Pablo 123 St.",
      recipientPhone: "09244562453",
      recipientBarangayId: brgy.id,
      assignedCourierId: courier.id,
      status: initialStatus,
      ...parcelOverrides,
    },
  });

  await seedParcelTrackingLogs(fastify, parcel.id, initialStatus);

  await fastify.prisma.$executeRaw`
    UPDATE parcels
    SET recipient_location = ST_SetSRID(ST_MakePoint(${14.22}, ${123.423}), 4326)
    WHERE id = ${parcel.id}
  `;

  return parcel;
}

/**
 * Helper to seed tracking log history sequentially based on ParcelStatus progression.
 */
async function seedParcelTrackingLogs(fastify: FastifyInstance, parcelId: number, currentStatus: ParcelStatus) {
  const firstMileSequence: ParcelStatus[] = [
    ParcelStatus.PendingPickup,
    ParcelStatus.ReadyForPickup,
    ParcelStatus.PickedUp,
    ParcelStatus.ArrivedAtOriginHub,
    ParcelStatus.DepartedFromOriginHub,
  ];

  const midMileSequence: ParcelStatus[] = [
    ParcelStatus.Sorting,
    ParcelStatus.Bagged,
    ParcelStatus.DepartedFromHub,
    ParcelStatus.ArrivedAtHub,
    ParcelStatus.ArrivedAtDestinationHub,
  ];

  const lastMileSequence: ParcelStatus[] = [
    ParcelStatus.OutForDelivery,
    ParcelStatus.Delivered,
    ParcelStatus.FailedDelivery,
    ParcelStatus.Rejected,
  ];

  const allStatuses = [...firstMileSequence, ...midMileSequence, ...lastMileSequence];
  const targetIndex = allStatuses.indexOf(currentStatus);

  const statusesToLog = targetIndex !== -1 
    ? allStatuses.slice(0, targetIndex + 1) 
    : [ParcelStatus.PendingPickup, currentStatus];

  if (!statusesToLog.includes(ParcelStatus.PendingPickup)) {
    statusesToLog.unshift(ParcelStatus.PendingPickup);
  }

  // Stagger timestamps incrementally so `createdAt` sorting is strictly chronological
  for (const [index, status] of statusesToLog.entries()) {
    await fastify.prisma.parcelLog.create({
      data: {
        parcelId,
        status,
        description: `Parcel status updated to ${status}`,
        createdAt: new Date(Date.now() + index * 1000), // Incremental timestamps
      },
    });
  }
}