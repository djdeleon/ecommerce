import { FacilityType, ParcelStatus, PipelineStatus } from "@prisma/client";
import { createCourier, createFacility } from "#factory";
import { FastifyInstance } from "fastify";
import { createSector } from "./sector.factory.js";

export async function createParcel(fastify: FastifyInstance, overrides: any = {}) {
  const randomSuffix = Math.floor(Math.random() * 1000000);

  let originId = overrides.originFacilityId ?? (await createFacility(fastify, {
    name: `Origin Mega Hub ${randomSuffix}`,
  })).id

  let originSectorId = null
  if (!overrides.originFacilityId) {
    originSectorId = (await createSector(fastify, {
      localBranchId: originId
    })).id
  } else {
    const { sectors } = await fastify.prisma.facility.findUniqueOrThrow({
      where: { id: originId },
      include: { sectors: true }
    })
    originSectorId = sectors[0].id
  }

  let destinationId = overrides.destinationFacilityId ?? (await createFacility(fastify, {
    name: `Destination Distribution Center ${randomSuffix}`,
    type: FacilityType.DistributionCenter,
  })).id

  let destinationSectorId = null
  if (!overrides.destinationFacilityId) {
    destinationSectorId = (await createSector(fastify, {
      localBranchId: destinationId
    })).id
  } else {
    const { sectors } = await fastify.prisma.facility.findUniqueOrThrow({
      where: { id: destinationId },
      include: { sectors: true }
    })
    destinationSectorId = sectors[0].id
  }

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

  const { courier } = await createCourier(fastify, { currentFacilityId: originId });

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

  const { clientId, parcelAmount, pipelineStatus, ...parcelOverrides } = overrides;
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
      originSectorId: originSectorId,
      currentSectorId: null,
      destinationSectorId: destinationSectorId,
      originFacilityId: originId,
      destinationFacilityId: destinationId,
      currentFacilityId: originId,
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

  if (pipelineStatus) {
    await seedParcelPipeline(fastify, parcel.id, originId, pipelineStatus);
  }

  await fastify.prisma.$executeRaw`
    UPDATE parcels
    SET recipient_location = ST_SetSRID(ST_MakePoint(${14.22}, ${123.423}), 4326)
    WHERE id = ${parcel.id}
  `;

  return parcel;
}

/**
 * Helper to seed parcel facility pipelines and status history.
 */
async function seedParcelPipeline(fastify: FastifyInstance, parcelId: number, facilityId: number, targetPipelineStatus: PipelineStatus) {
  const pipelineSequence: PipelineStatus[] = [
    PipelineStatus.Incoming,
    PipelineStatus.Arrived,
    PipelineStatus.Departed,
  ];

  const targetIndex = pipelineSequence.indexOf(targetPipelineStatus);
  const statusesToSeed = targetIndex !== -1
    ? pipelineSequence.slice(0, targetIndex + 1)
    : [PipelineStatus.Incoming, targetPipelineStatus];

  if (!statusesToSeed.includes(PipelineStatus.Incoming)) {
    statusesToSeed.unshift(PipelineStatus.Incoming);
  }

  for (const status of statusesToSeed) {
    await fastify.prisma.parcelFacilityPipeline.create({
      data: {
        parcelId,
        facilityId,
        sequenceOrder: status === PipelineStatus.Incoming ? 1 : status === PipelineStatus.Arrived ? 2 : 3,
        status,
        arrivedAt: status === PipelineStatus.Arrived || status === PipelineStatus.Departed ? new Date() : null,
        departedAt: status === PipelineStatus.Departed ? new Date() : null,
      },
    });
  }
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