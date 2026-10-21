import { FastifyInstance } from "fastify";
import { ShipmentStatus, ManifestStatus, CourierScheduleType } from "@prisma/client";
import { createParcel } from "./parcel.factory.js";
import { generateManifestCode } from "../../src/modules/manifests/service.js";

export async function createManifest(fastify: FastifyInstance, overrides: any = {}) {
  const facility = await fastify.prisma.facility.findFirstOrThrow({
    include: {
      sectors: true,
      vehicles: true,
      users: {
        where: { role: "Courier" },
        include: { courier: true }
      }
    }
  });

  const sector = facility.sectors[0];
  const vehicle = facility.vehicles[0];
  const courier = facility.users[0]?.courier;

  const parcelAmount = overrides.parcelAmount ?? 3
  const parcelIds: number[] = overrides.parcelIds || [];
  if (parcelIds.length === 0) {
    for (let i = 0; i < parcelAmount; i++) {
      const parcel = await createParcel(fastify, {
        originSectorId: sector.id,
        destinationSectorId: sector.id,
        currentFacilityId: facility.id,
        status: ShipmentStatus.ReadyForPickup,
        weightGrams: 300000,
        ...overrides.parcelOverrides,
      });
      parcelIds.push(parcel.id);
    }
  }

  const code = await generateManifestCode(fastify);

  return await fastify.prisma.$transaction(async (tx) => {
    const courierSchedule = await tx.courierSchedule.create({
      data: {
        vehicleId: vehicle.id,
        courierId: courier?.id ?? null,
        scheduledFor: CourierScheduleType.Accumulation,
        scheduledTime: new Date("2026-10-21T08:00:00.000Z"),
        ...overrides.courierScheduleOverrides,
      },
    });

    const manifest = await tx.manifest.create({
      data: {
        sectorId: sector.id,
        courierScheduleId: courierSchedule.id,
        code,
        status: ManifestStatus.Scheduled,
        currentWeightGrams: 21000,
        currentVolumeCbm: 0.15,
        ...overrides.manifestOverrides,
      },
    });

    await tx.parcel.updateMany({
      where: { id: { in: parcelIds } },
      data: { manifestId: manifest.id },
    });

    return {
      manifest,
      courierSchedule,
      parcelIds,
    };
  });
}