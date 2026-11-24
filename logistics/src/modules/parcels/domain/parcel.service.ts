import { FastifyInstance } from 'fastify';
import { CreateParcelCommand } from './parcel.commands.js';
import { HandoffType, ParcelStatus } from '@prisma/client';
import { generateTrackingNumbers } from '../../tracking-numbers/service.js';

export async function createParcel(
  fastify: FastifyInstance,
  command: CreateParcelCommand
) {
  const {
    weightGrams,
    lengthCm,
    widthCm,
    heightCm,
    declaredValue,
    shippingServiceType,
    recipientName,
    recipientPhone,
    recipientAddress,
    recipientBarangayId,
    recipientCoordinates,
    handoffType,
    originFacilityId,
    actor,
  } = command;

  let senderBarangayId: string;
  let storeId: number | null = null;
  let customerId: number | null = null;
  let externalOrderId: string | null = null;

  if ('storeId' in command) {
    const store = await fastify.prisma.store.findUnique({
      where: { id: command.storeId },
    });
    if (!store) throw new Error('StoreNotFound');

    storeId = store.id;
    externalOrderId = command.externalOrderId ?? null;
    senderBarangayId = store.barangayId;
  } else {
    const customer = await fastify.prisma.customer.findUnique({
      where: { id: command.customerId },
    });
    if (!customer) throw new Error('CustomerNotFound');

    customerId = customer.id;
    senderBarangayId = customer.barangayId;
  }

  // Validate PH Barangay Serviceability (Origin & Destination -> Sector -> LocalBranch)
  const [originBarangay, destinationBarangay] = await Promise.all([
    fastify.prisma.barangay.findUnique({
      where: { id: senderBarangayId },
      include: { sector: { include: { facility: true } } },
    }),
    fastify.prisma.barangay.findUnique({
      where: { id: recipientBarangayId },
      include: { sector: { include: { facility: true } } },
    }),
  ]);
  console.log(originBarangay)
  console.log(destinationBarangay)

  if (!originBarangay || !destinationBarangay) {
    throw new Error('InvalidBarangay');
  }

  if (!originBarangay.sector || !destinationBarangay.sector) {
    throw new Error('AreaNotServiceable');
  }

  const originSector = originBarangay.sector;
  const destinationSector = destinationBarangay.sector;

  // Resolve Facilities & Initial Status based on HandoffType
  const isDropoff = handoffType === HandoffType.SenderDropoff;
  const resolvedOriginFacilityId = originFacilityId ?? originSector.facilityId;
  const resolvedDestinationFacilityId = destinationSector.facilityId;

  console.log({ isDropoff })

  const initialStatus = isDropoff
    ? ParcelStatus.ArrivedAtOriginHub
    : ParcelStatus.PendingPickup;

  // Compute Logistics Metrics & Cache Strings
  const calculatedCbm = (lengthCm * widthCm * heightCm) / 1_000_000;
  const sortingCodeCache = `${destinationSector.code}-${shippingServiceType}`;
  const routingPipelineCache = `${resolvedOriginFacilityId}->${resolvedDestinationFacilityId}`;

  return await fastify.prisma.$transaction(async (tx) => {
    const trackingNumbers = await generateTrackingNumbers(tx, { size: 1 });
    const trackingNumber = `${trackingNumbers[0].number}`

    const parcel = await tx.parcel.create({
      data: {
        trackingNumber,
        externalOrderId,
        storeId,
        customerId,
        weightGrams,
        lengthCm,
        widthCm,
        heightCm,
        calculatedCbm,
        declaredValue,
        shippingServiceType,
        originSectorId: originSector.id,
        currentSectorId: isDropoff ? originSector.id : null,
        destinationSectorId: destinationSector.id,
        originFacilityId: resolvedOriginFacilityId,
        destinationFacilityId: resolvedDestinationFacilityId,
        currentFacilityId: isDropoff ? resolvedOriginFacilityId : null,
        sortingCodeCache,
        routingPipelineCache,
        recipientName,
        recipientPhone,
        recipientAddress,
        recipientBarangayId,
        handoffType,
        status: initialStatus,
      },
      include: {
        store: true,
        customer: true,
        recipientBarangay: true,
        originSector: true,
        destinationSector: true,
        originFacility: true,
        destinationFacility: true,
      },
    });

    let formattedParcel: any = parcel;

    // Save PostGIS Point if coordinates were provided
    if (recipientCoordinates) {
      console.log({ recipientCoordinates })
      await tx.$executeRaw`
        UPDATE "parcels"
        SET recipient_location = ST_SetSRID(ST_MakePoint(${recipientCoordinates.lng}, ${recipientCoordinates.lat}), 4326)
        WHERE id = ${parcel.id}
      `;

      formattedParcel = {
        ...parcel,
        recipientCoordinates: {
          lat: recipientCoordinates.lat,
          lng: recipientCoordinates.lng
        }
      };
    }

    // Write initial tracking log
    await tx.parcelLog.create({
      data: {
        parcelId: parcel.id,
        status: initialStatus,
        description: isDropoff
          ? `Parcel dropped off at branch (Created by ${actor.role})`
          : `Parcel booked for courier pickup (Created by ${actor.role})`,
      },
    });

    return formattedParcel;
  });
}

export async function getClientParcelById(
  fastify: FastifyInstance,
  parcelId: number,
  clientId: number
) {
  const parcel = await fastify.prisma.parcel.findFirst({
    where: {
      id: parcelId,
      clientId, // Enforces ownership at the query level
    },
    include: {
      senderBarangay: true,
      recipientBarangay: true,
      trackingLogs: { orderBy: { createdAt: 'desc' } },
    },
  });

  if (!parcel) {
    throw new Error('ParcelNotFound');
  }

  return parcel;
}

export async function getAdminParcelById(
  fastify: FastifyInstance,
  parcelId: number
) {
  const parcel = await fastify.prisma.parcel.findUnique({
    where: { id: parcelId },
    include: {
      client: true,
      senderBarangay: { include: { sector: true } },
      recipientBarangay: { include: { sector: true } },
      originBranch: true,
      destinationBranch: true,
      trackingLogs: { orderBy: { createdAt: 'desc' } },
    },
  });

  if (!parcel) {
    throw new Error('ParcelNotFound');
  }

  return parcel;
}
