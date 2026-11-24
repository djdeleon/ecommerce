import { FastifyInstance } from "fastify";
import { ParcelStatus, ManifestStatus, FleetTransportType, UserRole } from "@prisma/client";
import { createParcel } from "./parcel.factory.js";
import { generateManifestCode } from "../../src/modules/manifests/service.js";

/**
 * Helper to determine what logs should exist based on the initial starting status.
 */
function getLogHistoryForStatus(status: ManifestStatus): ManifestStatus[] {
  switch (status) {
    case ManifestStatus.Scheduled:
      return [ManifestStatus.Scheduled];
    case ManifestStatus.Dispatched:
      return [ManifestStatus.Scheduled, ManifestStatus.Dispatched];
    case ManifestStatus.Accumulating:
      return [ManifestStatus.Scheduled, ManifestStatus.Dispatched, ManifestStatus.Accumulating];
    case ManifestStatus.Completed:
      return [ManifestStatus.Scheduled, ManifestStatus.Dispatched, ManifestStatus.Accumulating, ManifestStatus.Completed];
    case ManifestStatus.Arrived:
      return [ManifestStatus.Scheduled, ManifestStatus.Dispatched, ManifestStatus.Accumulating, ManifestStatus.Arrived];
    case ManifestStatus.Cancelled:
      return [ManifestStatus.Scheduled, ManifestStatus.Cancelled];
    default:
      return [ManifestStatus.Scheduled];
  }
}

export async function createManifest(fastify: FastifyInstance, overrides: any = {}) {
  const facility = await fastify.prisma.facility.findFirstOrThrow({
    include: {
      sectors: true,
      vehicles: true,
      users: {
        where: { role: UserRole.Courier },
        include: { courier: true }
      }
    }
  });

  const sector = facility.sectors[0];
  const vehicle = facility.vehicles[0];
  const courier = facility.users[0]?.courier;

  const parcelAmount = overrides.parcelOverrides?.parcelAmount ?? 3
  const parcelIds: number[] = overrides.parcelIds || [];
  if (parcelIds.length === 0) {
    for (let i = 0; i < parcelAmount; i++) {
      const parcel = await createParcel(fastify, {
        originSectorId: sector.id,
        destinationSectorId: sector.id,
        currentFacilityId: facility.id,
        status: ParcelStatus.ReadyForPickup,
        weightGrams: 300000,
        ...overrides.parcelOverrides,
      });
      parcelIds.push(parcel.id);
    }
  }

  const code = await generateManifestCode(fastify);
  const initialStatus = overrides.manifestOverrides?.status || ManifestStatus.Scheduled;
  const logStatuses = getLogHistoryForStatus(initialStatus);

  return await fastify.prisma.$transaction(async (tx) => {
    const fleetTransport = await tx.fleetTransport.create({
      data: {
        facilityId: facility.id,
        vehicleId: vehicle.id,
        courierId: courier?.id ?? null,
        scheduledFor: FleetTransportType.Accumulation,
        scheduledTime: new Date("2026-10-21T08:00:00.000Z"),
        ...overrides.fleetTransportOverrides,
      },
    });

    const manifest = await tx.manifest.create({
      data: {
        sectorId: sector.id,
        fleetTransportId: fleetTransport.id,
        code,
        status: initialStatus,
        currentWeightGrams: 21000,
        currentVolumeCbm: 0.15,
        ...overrides.manifestOverrides,
      },
    });

    // Create all historical log entries matching the starting status
    for (const [index, logStatus] of logStatuses.entries()) {
      await tx.manifestLog.create({
        data: {
          manifestId: manifest.id,
          status: logStatus,
          // Stagger timestamps slightly so ordering is predictable
          recordedAt: new Date(Date.now() - (logStatuses.length - index) * 1000),
        },
      });
    }

    await tx.parcel.updateMany({
      where: { id: { in: parcelIds } },
      data: { manifestId: manifest.id },
    });

    return {
      manifest,
      fleetTransport,
      parcelIds,
    };
  });
}