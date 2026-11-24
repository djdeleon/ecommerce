import { CourierStatus, FleetTransportType, ManifestStatus, Prisma, ParcelStatus } from "@prisma/client";
import { FastifyInstance } from "fastify";
import { assertTransition } from "./state-machine.js";
import { CreateManifestBody, UpdateManifestBody } from "./schema.js";

export async function generateManifestCode(fastify: FastifyInstance): Promise<string> {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');

  const datePrefix = `MNF-${year}${month}${day}`;

  const countToday = await fastify.prisma.manifest.count({
    where: {
      code: {
        startsWith: datePrefix,
      },
    },
  });

  const sequenceNumber = String(countToday + 1).padStart(3, '0');

  return `${datePrefix}-${sequenceNumber}`;
}

async function updateAndLogManifest(
  tx: Prisma.TransactionClient,
  manifestId: number,
  newStatus: ManifestStatus
) {
  const updatedManifest = await tx.manifest.update({
    where: { id: manifestId },
    data: { status: newStatus },
  });

  await tx.manifestLog.create({
    data: {
      manifestId,
      status: newStatus,
      recordedAt: new Date(),
    },
  });

  return updatedManifest;
}

export async function indexManifest(fastify: FastifyInstance, facilityId: number) {
  const [facilityRaw]: any[] = await fastify.prisma.$queryRaw`
    SELECT id, name, code, address, type, parent_id AS "parentId", ST_AsGeoJSON(location)::json AS location
    FROM facilities WHERE id = ${facilityId}
  `;

  const sectorsRaw: any[] = await fastify.prisma.$queryRaw`
    SELECT id, code, facility_id AS "facilityId", ST_AsGeoJSON(zone)::json AS zone
    FROM sectors WHERE facility_id = ${facilityId}
  `;

  const facility = { ...facilityRaw, sectors: sectorsRaw };
  const sectorIds = sectorsRaw.map(s => s.id);

  const sectorAggregates: any[] = await fastify.prisma.$queryRaw`
    SELECT 
      "origin_sector_id" AS "originSectorId",
      COUNT(id)::int AS "totalCount",
      SUM(weight_grams)::int AS "totalWeightGrams",
      SUM(calculated_cbm)::float AS "totalCbm",
      SUM(declared_value)::float AS "totalDeclaredValue",
      array_agg(id) AS "parcelIds" 
    FROM parcels
    WHERE status = 'ready_for_pickup'::parcel_status
    AND current_facility_id IS NULL
    AND origin_sector_id = ANY(${sectorIds})
    AND manifest_id IS NULL
    GROUP BY "origin_sector_id"
  `;

  const physicalVehicles = await fastify.prisma.physicalVehicle.findMany({
    where: {
      assignedFacilityId: facilityId,
      status: "Available"
    },
    include: { vehicleProfile: true }
  });

  const assignedVehicleIds = new Set<number>();
  const manifestsBySector = sectorAggregates.map(sectorAgg => {
    const sectorWeight = sectorAgg.totalWeightGrams ?? 0;
    const sectorVolume = sectorAgg.totalCbm ?? 0;

    const eligibleVehicles = physicalVehicles.filter(vehicle => {
      if (assignedVehicleIds.has(vehicle.id)) return false;
      const profile = vehicle.vehicleProfile;
      return (
        profile.maxWeightCapacityG >= sectorWeight &&
        profile.maxUsableVolumeCbm >= sectorVolume
      );
    });

    eligibleVehicles.sort((a, b) => a.vehicleProfile.maxWeightCapacityG - b.vehicleProfile.maxWeightCapacityG);
    const selectedVehicle = eligibleVehicles[0] || null;

    if (selectedVehicle) {
      assignedVehicleIds.add(selectedVehicle.id);
    }

    return {
      originSectorId: sectorAgg.originSectorId,
      totalCount: sectorAgg.totalCount,
      totalWeightGrams: sectorWeight,
      totalCbm: Number(sectorVolume.toFixed(4)),
      totalDeclaredValue: sectorAgg.totalDeclaredValue,
      parcelIds: sectorAgg.parcelIds,
      selectedVehicle,
    };
  });

  const pendingParcelsRaw: any[] = await fastify.prisma.$queryRaw`
    SELECT 
      p.id, 
      p.tracking_number AS "trackingNumber", 
      p.origin_sector_id AS "originSectorId",
      p.status,
      p.weight_grams AS "weightGrams",
      p.calculated_cbm AS "calculatedCbm",
      s.name AS "storeName",
      ST_AsGeoJSON(s.location)::json AS "location" 
    FROM parcels p
    JOIN stores s ON p.store_id = s.id
    WHERE p.status = 'ready_for_pickup'::parcel_status
    AND p.current_facility_id IS NULL
    AND p.origin_facility_id = ${facilityId}
    AND p.manifest_id IS NULL
  `;

  const pendingParcels = pendingParcelsRaw.map(p => ({
    ...p,
    location: p.location?.coordinates || null
  }));

  return {
    facility,
    availableVehicles: physicalVehicles,
    queue: manifestsBySector,
    pendingParcels,
  };
}

export async function createManifest(fastify: FastifyInstance, facilityId: number, data: CreateManifestBody) {
  const sanitizedCourierId = (data.courierId === 0 || !data.courierId) ? null : data.courierId;
  const code = await generateManifestCode(fastify);

  const result = await fastify.prisma.$transaction(async (tx) => {
    const fleetTransport = await tx.fleetTransport.create({
      data: {
        facilityId,
        courierId: sanitizedCourierId,
        vehicleId: data.vehicleId,
        scheduledTime: new Date(data.scheduledTime),
        scheduledFor: FleetTransportType.Accumulation,
      },
    });

    const manifest = await tx.manifest.create({
      data: {
        sectorId: data.sectorId,
        fleetTransportId: fleetTransport.id,
        code,
        status: ManifestStatus.Scheduled,
        currentWeightGrams: data.currentWeightGrams,
        currentVolumeCbm: data.currentVolumeCbm,
      },
    });

    await tx.manifestLog.create({
      data: {
        manifestId: manifest.id,
        status: ManifestStatus.Scheduled,
        recordedAt: new Date(),
      },
    });

    const updatedParcels = await tx.parcel.updateManyAndReturn({
      where: { id: { in: data.parcelIds } },
      data: { manifestId: manifest.id },
    });

    return {
      manifest,
      fleetTransport,
      totalParcels: updatedParcels.length,
    };
  });

  return {
    manifestId: result.manifest.id,
    code: result.manifest.code,
    fleetTransportId: result.fleetTransport.id,
    fleetTransport: result.fleetTransport,
    totalParcels: result.totalParcels,
    currentWeightGrams: result.manifest.currentWeightGrams,
    currentVolumeCbm: result.manifest.currentVolumeCbm,
  };
}

export async function showManifest(fastify: FastifyInstance, code: string) {
  const manifest = await fastify.prisma.manifest.findUniqueOrThrow({
    where: { code },
    include: {
      sector: true,
      fleetTransport: {
        include: {
          vehicle: { include: { vehicleProfile: true } },
          courier: { include: { user: true } },
        },
      },
      parcels: true,
      logs: {
        orderBy: { recordedAt: 'desc' },
      },
    },
  });

  return manifest;
}

export async function updateManifest(fastify: FastifyInstance, code: string, data: UpdateManifestBody) {
  const updatedManifest = await fastify.prisma.manifest.update({
    where: { code },
    data: {
      ...(data.status !== undefined && { status: data.status }),
      ...(data.currentWeightGrams !== undefined && { currentWeightGrams: data.currentWeightGrams }),
      ...(data.currentVolumeCbm !== undefined && { currentVolumeCbm: data.currentVolumeCbm }),
    },
    include: {
      fleetTransport: {
        include: { vehicle: true, courier: true }
      }
    },
  });

  return updatedManifest;
}

export async function dispatchManifest(fastify: FastifyInstance, code: string) {
  // 1. State Machine Validation
  const manifest = await fastify.prisma.manifest.findUniqueOrThrow({
    where: { code },
    include: { parcels: true, fleetTransport: true },
  });

  assertTransition(manifest.status, ManifestStatus.Dispatched, manifest.code);

  return await fastify.prisma.$transaction(async (tx) => {
    // 2. Update the Entity
    const updatedManifest = await updateAndLogManifest(tx, manifest.id, ManifestStatus.Dispatched);

    // 4. Handle State Machine Side Effects
    if (manifest.fleetTransportId) {
      await tx.fleetTransport.update({
        where: { id: manifest.fleetTransportId },
        data: { dispatchedAt: new Date() },
      });

      const fleetTransport = await fastify.prisma.fleetTransport.findUniqueOrThrow({
        where: { id: manifest.fleetTransportId }
      })
      if (!fleetTransport.courierId) {
        throw new Error("Cannot dispatch manifest: No courier assigned to this Fleet Transport.");
      }
      const assignedCourierId = fleetTransport.courierId;

      await tx.courierLog.create({
        data: {
          courierId: assignedCourierId,
          status: CourierStatus.Busy
        }
      })
    }

    return updatedManifest;
  });
}

export async function accumulateManifest(fastify: FastifyInstance, code: string) {
  // 1. State Machine Validation
  const manifest = await fastify.prisma.manifest.findUniqueOrThrow({
    where: { code },
    include: { parcels: true, fleetTransport: true },
  });

  assertTransition(manifest.status, ManifestStatus.Accumulating, manifest.code);

  return await fastify.prisma.$transaction(async (tx) => {
    // 2. Update the Entity
    const updatedManifest = await updateAndLogManifest(tx, manifest.id, ManifestStatus.Accumulating);

    return updatedManifest;
  });
}

export async function completeManifest(fastify: FastifyInstance, code: string) {
  // 1. State Machine Validation
  const manifest = await fastify.prisma.manifest.findUniqueOrThrow({
    where: { code },
    include: { parcels: true, fleetTransport: true },
  });

  assertTransition(manifest.status, ManifestStatus.Completed, manifest.code);

  const totalParcels = await fastify.prisma.parcel.aggregate({
    where: { manifestId: manifest.id },
    _count: { id: true }
  })
  const totalPickedUpParcels = await fastify.prisma.parcel.aggregate({
    where: { manifestId: manifest.id, status: ParcelStatus.PickedUp },
    _count: { id: true }
  })
  const remainingParcels = totalParcels._count.id - totalPickedUpParcels._count.id
  if (remainingParcels) {
    throw new Error(`Manifest cannot be completed. There are ${remainingParcels} parcels left...`)
  }

  return await fastify.prisma.$transaction(async (tx) => {
    // 2. Update the Entity
    return await updateAndLogManifest(tx, manifest.id, ManifestStatus.Completed);
  });
}

export async function arriveManifest(fastify: FastifyInstance, code: string) {
  // 1. State Machine Validation
  const manifest = await fastify.prisma.manifest.findUniqueOrThrow({
    where: { code },
    include: { parcels: true, fleetTransport: true },
  });

  assertTransition(manifest.status, ManifestStatus.Arrived, manifest.code);

  return await fastify.prisma.$transaction(async (tx) => {
    // 2. Update the Entity
    const updatedManifest = await updateAndLogManifest(tx, manifest.id, ManifestStatus.Arrived);

    // 4. Handle State Machine Side Effects
    if (manifest.fleetTransportId) {
      await tx.fleetTransport.update({
        where: { id: manifest.fleetTransportId },
        data: { arrivedAt: new Date() },
      });

      const fleetTransport = await fastify.prisma.fleetTransport.findUniqueOrThrow({
        where: { id: manifest.fleetTransportId }
      })
      if (!fleetTransport.courierId) {
        throw new Error("Cannot dispatch manifest: No courier assigned to this Fleet Transport.");
      }
      const assignedCourierId = fleetTransport.courierId;

      await tx.courierLog.create({
        data: {
          courierId: assignedCourierId,
          status: CourierStatus.Available
        }
      })
    }

    if (manifest.parcels.length > 0) {
      const parcelIds = manifest.parcels.map((p) => p.id);

      await tx.parcel.updateMany({
        where: { id: { in: parcelIds } },
        data: { status: ParcelStatus.ArrivedAtOriginHub },
      });

      for (const parcel of manifest.parcels) {
        await tx.parcelLog.create({
          data: {
            parcelId: parcel.id,
            status: ParcelStatus.ArrivedAtOriginHub,
            description: `Manifest ${manifest.code} has arrived at destination hub.`,
          },
        });
      }
    }

    return updatedManifest;
  });
}

export async function cancelManifest(fastify: FastifyInstance, code: string) {
  // 1. State Machine Validation
  const manifest = await fastify.prisma.manifest.findUniqueOrThrow({
    where: { code },
    include: { parcels: true, fleetTransport: true },
  });

  assertTransition(manifest.status, ManifestStatus.Cancelled, manifest.code);

  return await fastify.prisma.$transaction(async (tx) => {
    // 2. Update the Entity
    const updatedManifest = await updateAndLogManifest(tx, manifest.id, ManifestStatus.Cancelled);

    // 4. Handle State Machine Side Effects
    // Unlink or update parcels if they were attached to this cancelled manifest
    if (manifest.parcels.length > 0) {
      const parcelIds = manifest.parcels.map((p) => p.id);

      // Detach parcels from the manifest so they can be re-manifested
      await tx.parcel.updateMany({
        where: { id: { in: parcelIds } },
        data: { manifestId: null },
      });

      for (const parcel of manifest.parcels) {
        await tx.parcelLog.create({
          data: {
            parcelId: parcel.id,
            status: ParcelStatus.ArrivedAtOriginHub,
            description: `Manifest ${manifest.code} was cancelled. Parcel unlinked.`,
          },
        });
      }
    }

    return updatedManifest;
  });
}

export async function deleteManifest(fastify: FastifyInstance, code: string) {
  const manifest = await fastify.prisma.manifest.findUniqueOrThrow({
    where: { code },
    include: { parcels: true },
  });

  return await fastify.prisma.$transaction(async (tx) => {
    if (manifest.parcels.length > 0) {
      await tx.parcel.updateMany({
        where: { manifestId: manifest.id },
        data: { manifestId: null },
      });
    }

    await tx.manifestLog.deleteMany({
      where: { manifestId: manifest.id },
    });

    const deletedManifest = await tx.manifest.delete({
      where: { code },
    });

    if (manifest.fleetTransportId) {
      await tx.fleetTransport.delete({
        where: { id: manifest.fleetTransportId },
      }).catch(() => {
        // Ignore if fleet transport is referenced elsewhere or handled separately
      });
    }

    return deletedManifest;
  });
}