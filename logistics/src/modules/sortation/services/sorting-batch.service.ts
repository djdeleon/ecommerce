import { FastifyInstance } from "fastify";
import { CreateSortationBatchBody, UpdateSortationBatchBody } from "../schemas/sorting-batch.schema.js";
import parseId from "#commons/utils/id-parser.js";
import { MasterBag, MasterBagStatus, ShipmentStatus, SortationBatchStatus } from "@prisma/client";
import { generateMasterBagCode, getOrCreateActiveMasterBag } from "./master-bag.service.js";
import { generateEventDescription } from "../../tracking-logs/logisticsEventDictionary.js";

// [FACILITY_CODE]-[YYYYMMDD]-[SHIFT_CODE]-[SEQUENCE]
export async function generateBatchCode(
  fastify: FastifyInstance,
  facilityId: number,
  shift: 'NIGHT' | 'MORNING'
): Promise<string> {
  const facility = await fastify.prisma.facility.findUniqueOrThrow({
    where: { id: facilityId },
    select: { code: true }
  });

  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;

  const prefix = `${facility.code}-${dateStr}-${shift}`;

  const countToday = await fastify.prisma.sortationBatch.count({
    where: {
      code: {
        startsWith: prefix,
      },
    },
  });

  const sequence = String(countToday + 1).padStart(3, '0');

  return `${prefix}-${sequence}`;
}

export async function createSortingBatch(
  fastify: FastifyInstance,
  data: CreateSortationBatchBody
) {
  const { code, startTime, endTime, cutOffTime, facilityId, status } = data

  return await fastify.prisma.sortationBatch.create({
    data: {
      code,
      startTime: startTime ?? undefined,
      endTime: endTime ?? undefined,
      cutOffTime,
      facilityId,
      status: status ? (status as SortationBatchStatus) : undefined,
    },
  })
}

export async function simulateScannerTunnelPass(fastify: FastifyInstance, trackingNumber: string) {
  const MAX_BAG_WEIGHT_G = 30000; // 30kg limit
  const MAX_BAG_VOLUME_CBM = 0.03; // 30ltr limit
  const MAX_BAG_PARCELS = 50;

  const activeSortingBatch = await fastify.prisma.sortationBatch.findFirst({
    where: { status: SortationBatchStatus.Active }
  })
  if (!activeSortingBatch) {
    throw new Error("No active Sorting Batch is created.")
  }

  const parcel = await fastify.prisma.parcel.findUniqueOrThrow({
    where: { trackingNumber },
    include: { destinationFacility: true }
  });
  if (!parcel.currentFacilityId) {
    throw new Error("Parcel doesn't have a current facility...")
  }
  const currentFacilityId = parcel.currentFacilityId
  const facility = await fastify.prisma.facility.findFirstOrThrow({
    where: { id: currentFacilityId }
  })
  const routingPipelineSegments = parcel.routingPipelineCache.split(' > ')
  let nextFacilityCode = null
  for (const [idx, code] of routingPipelineSegments.entries()) {
    if (code === facility.code && idx < routingPipelineSegments.length - 1) {
      nextFacilityCode = routingPipelineSegments[idx + 1]
      break
    }
  }
  if (!nextFacilityCode) {
    throw new Error("Failed to identify next facility...")
  }
  const nextFacility = await fastify.prisma.facility.findFirst({
    where: { code: nextFacilityCode }
  })
  if (!nextFacility) {
    throw new Error("Next Facility doesn't exist...")
  }

  // Slight realistic jitter (e.g. between -5% and +5%) to original specs
  const jitterFactor = () => (Math.random() * 0.1) + 0.95; // Multiplier between 0.95 and 1.05

  const simulatedWeightGrams = Math.round(parcel.weightGrams * jitterFactor());
  const lengthCm = Number((parcel.lengthCm * jitterFactor()).toFixed(1));
  const widthCm = Number((parcel.widthCm * jitterFactor()).toFixed(1));
  const heightCm = Number((parcel.heightCm * jitterFactor()).toFixed(1));
  const calculatedCbm = Number(((lengthCm * widthCm * heightCm) / 1000000).toFixed(4));


  let activeMasterBag: MasterBag

  activeMasterBag = await getOrCreateActiveMasterBag(
    fastify,
    activeSortingBatch.id,
    currentFacilityId,
    nextFacility.id
  );

  if (activeMasterBag.totalWeight + simulatedWeightGrams > MAX_BAG_WEIGHT_G || activeMasterBag.totalCbm + calculatedCbm > MAX_BAG_VOLUME_CBM || activeMasterBag.totalParcels >= MAX_BAG_PARCELS) {
    if (activeMasterBag.status !== MasterBagStatus.Open) {
      throw new Error("Active Master Bag cannot transition to Full...")
    }

    await fastify.prisma.masterBag.update({
      where: { id: activeMasterBag.id },
      data: {
        status: MasterBagStatus.Full,
      }
    });
    await fastify.prisma.masterBagLog.create({
      data: {
        masterBagId: activeMasterBag.id,
        status: MasterBagStatus.Full
      }
    })
    const masterBagParcels = (await fastify.prisma.masterBag.findUniqueOrThrow({
      where: { id: activeMasterBag.id },
      include: { parcels: true }
    })).parcels

    const parcelIds = masterBagParcels.map((p) => p.id)
    await fastify.prisma.parcel.updateMany({
      where: { id: { in: parcelIds } },
      data: {
        status: ShipmentStatus.Bagged
      }
    })
    for (const id of parcelIds) {
      await fastify.prisma.trackingLog.create({
        data: {
          parcelId: id,
          status: ShipmentStatus.Bagged,
          description: generateEventDescription({ status: ShipmentStatus.Bagged })
        }
      })
    }

    const code = await generateMasterBagCode(fastify, currentFacilityId);

    activeMasterBag = await fastify.prisma.masterBag.create({
      data: {
        code,
        sortingBatchId: activeSortingBatch.id,
        currentFacilityId,
        nextFacilityId: nextFacility.id,
      }
    });
  }

  await fastify.prisma.masterBag.update({
    where: { id: activeMasterBag.id },
    data: {
      totalParcels: { increment: 1 },
      totalWeight: { increment: simulatedWeightGrams },
      totalCbm: { increment: calculatedCbm }
    }
  });

  // Sortation Batch -> Master Bag -> Parcel
  await fastify.prisma.parcel.update({
    where: { id: parcel.id },
    data: { masterBagId: activeMasterBag.id }
  })

  const auditedParcel = await fastify.prisma.$transaction(async (tx) => {
    const auditLog = await tx.parcelAuditLog.create({
      data: {
        parcelId: parcel.id,
        weightGrams: simulatedWeightGrams,
        lengthCm,
        widthCm,
        heightCm,
        calculatedCbm,
      }
    });

    await tx.parcel.update({
      where: { id: parcel.id },
      data: { status: ShipmentStatus.Sorting }
    });

    await tx.trackingLog.create({
      data: {
        parcelId: parcel.id,
        status: ShipmentStatus.Sorting,
        description: `Automated scanner tunnel audit: Measured Weight ${simulatedWeightGrams}g (Declared: ${parcel.weightGrams}g), Dims ${lengthCm}x${widthCm}x${heightCm}cm.`
      }
    });

    return auditLog;
  });

  return {
    tunnelSensorStatus: "SUCCESS",
    hardwareMessage: `Parcel routed to Chute for facility: ${parcel.destinationFacility?.name || 'Main Hub'}`,
    data: {
      auditedParcel,
      nextFacilityCode,
    }
  };
}

export async function updateSortingBatch(
  fastify: FastifyInstance,
  idParam: string,
  data: UpdateSortationBatchBody
) {
  const id = parseId(idParam)
  const { code, startTime, endTime, facilityId, status, completedAt } = data

  return await fastify.prisma.sortationBatch.update({
    where: { id },
    data: {
      ...(code && { code }),
      ...(startTime !== undefined && { startTime: startTime ? new Date(startTime) : null }),
      ...(endTime !== undefined && { endTime: endTime ? new Date(endTime) : null }),
      ...(facilityId && { facilityId }),
      ...(status && { status: status as SortationBatchStatus }),
      ...(completedAt !== undefined && { completedAt: completedAt ? new Date(completedAt) : null }),
    },
  })
}

export async function deleteSortingBatch(
  fastify: FastifyInstance,
  idParam: string
) {
  const id = parseId(idParam)

  return await fastify.prisma.sortationBatch.delete({
    where: { id },
  })
}