import { FastifyInstance } from "fastify";
import {
  CreateManifestBody,
  CreateManifestSchema,
  MANIFEST_PATHS
} from "./schema.js";
import { CourierStatus, ManifestStatus, ShipmentStatus } from "@prisma/client";
import { userAuth } from "#commons/middlewares/user-auth.js";
import { generateManifestCode } from "./service.js";
import { generateEventDescription } from "../tracking-logs/logisticsEventDictionary.js";

export default async function manifestRoutes(fastify: FastifyInstance) {
  // TODO: Middleware to check and get the Manager Data to get its assigned facility
  fastify.get(MANIFEST_PATHS.index, { preHandler: [userAuth] }, async (req, rep) => {
    const manager = (req as any).user

    const facility = await fastify.prisma.facility.findUniqueOrThrow({
      where: { id: manager.assignedFacilityId },
      include: { sectors: true }
    })

    const sectorIds = facility.sectors.map(s => s.id);
    const sectorAggregates = await fastify.prisma.parcel.groupBy({
      by: ['originSectorId'],
      where: {
        status: ShipmentStatus.ReadyForPickup,
        currentFacilityId: manager.assignedFacilityId,
        originSectorId: { in: sectorIds },
      },
      _count: {
        id: true,
      },
      _sum: {
        weightGrams: true,
        calculatedCbm: true,
        declaredValue: true,
      },
    });

    const physicalVehicles = await fastify.prisma.physicalVehicle.findMany({
      where: {
        assignedFacilityId: manager.assignedFacilityId,
        status: "Available"
      },
      include: { vehicleProfile: true }
    });

    const assignedVehicleIds = new Set<number>();

    const manifestsBySector = sectorAggregates.map(sectorAgg => {
      const sectorWeight = sectorAgg._sum.weightGrams ?? 0;
      const sectorVolume = sectorAgg._sum.calculatedCbm ?? 0;

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
        assignedVehicleIds.add(selectedVehicle.id); // Mark as used so next sector picks a different vehicle
      }

      return {
        originSectorId: sectorAgg.originSectorId,
        totalCount: sectorAgg._count.id,
        totalWeightGrams: sectorWeight,
        totalCbm: Number(sectorVolume.toFixed(4)),
        totalDeclaredValue: sectorAgg._sum.declaredValue,
        selectedVehicle,
      };
    });

    return rep.status(200).send({
      message: 'Manifests retrieved.',
      data: manifestsBySector
    })
  })

  fastify.post<{ Body: CreateManifestBody }>(MANIFEST_PATHS.store, { schema: CreateManifestSchema }, async (req, rep) => {
    const { sectorId, courierId, vehicleId, scheduledTime, parcelIds, currentWeightGrams, currentVolumeCbm } = req.body;

    const result = await fastify.prisma.$transaction(async (tx) => {
      const courierSchedule = await tx.courierSchedule.create({
        data: {
          courierId: courierId ?? null,
          vehicleId,
          scheduledTime: new Date(scheduledTime),
        },
      });

      const manifestCode = await generateManifestCode(fastify);
      const manifest = await tx.manifest.create({
        data: {
          sectorId,
          courierScheduleId: courierSchedule.id,
          code: manifestCode,
          currentWeightGrams,
          currentVolumeCbm,
        },
      });

      await tx.manifestLog.create({
        data: {
          manifestId: manifest.id,
        }
      })

      const updatedParcels = await tx.parcel.updateManyAndReturn({
        where: { id: { in: parcelIds } },
        data: { manifestId: manifest.id },
      });

      return {
        manifest,
        courierSchedule,
        updatedParcels,
      };
    });

    return rep.status(201).send({
      message: 'Manifest created successfully.',
      data: {
        manifestId: result.manifest.id,
        code: result.manifest.code,
        courierScheduleId: result.courierSchedule.id,
        courierSchedule: result.courierSchedule,
        totalParcels: result.updatedParcels.length,
        currentWeightGrams: result.manifest.currentWeightGrams,
        currentVolumeCbm: result.manifest.currentVolumeCbm,
      },
    })
  })

  fastify.patch(MANIFEST_PATHS.dispatch, async (req, rep) => {
    const { manifestCode } = req.params as { manifestCode: string }

    const manifest = await fastify.prisma.manifest.findUniqueOrThrow({
      where: { code: manifestCode },
      include: { parcels: true }
    });

    const courierSchedule = await fastify.prisma.courierSchedule.findUniqueOrThrow({
      where: { id: manifest.courierScheduleId }
    })
    if (!courierSchedule.courierId) {
      throw new Error("Cannot dispatch manifest: No courier assigned to this schedule.");
    }
    const assignedCourierId = courierSchedule.courierId;

    const sector = await fastify.prisma.sector.findUniqueOrThrow({
      where: { id: manifest.sectorId }
    })

    const updatedManifest = await fastify.prisma.$transaction(async (tx) => {
      const updatedManifest = await tx.manifest.update({
        where: { id: manifest.id },
        data: { status: ManifestStatus.Accumulating }
      });

      await tx.manifestLog.create({
        data: {
          manifestId: manifest.id,
          status: ManifestStatus.Accumulating
        }
      })

      await tx.dispatchLog.create({
        data: {
          assignedCourierId,
          originFacilityId: sector.localBranchId
        }
      })

      await tx.courierLog.create({
        data: {
          courierId: assignedCourierId,
          status: CourierStatus.Busy
        }
      })

      return updatedManifest
    });

    return rep.status(200).send({
      message: 'Manifest dispatched.',
      data: updatedManifest
    })
  })

  fastify.patch(MANIFEST_PATHS.complete, async (req, rep) => {
    const { manifestCode } = req.params as { manifestCode: string }

    const manifest = await fastify.prisma.manifest.findUniqueOrThrow({
      where: { code: manifestCode },
    })
    const totalParcels = await fastify.prisma.parcel.aggregate({
      where: { manifestId: manifest.id },
      _count: { id: true }
    })
    const totalPickedUpParcels = await fastify.prisma.parcel.aggregate({
      where: { manifestId: manifest.id, status: ShipmentStatus.PickedUp },
      _count: { id: true }
    })
    const remainingParcels = totalParcels._count.id - totalPickedUpParcels._count.id
    if (remainingParcels) {
      throw new Error(`Manifest cannot be completed. There are ${remainingParcels} parcels left...`)
    }

    const courierSchedule = await fastify.prisma.courierSchedule.findUniqueOrThrow({
      where: { id: manifest.courierScheduleId }
    })
    if (!courierSchedule.courierId) {
      throw new Error("Cannot dispatch manifest: No courier assigned to this schedule.");
    }

    const updatedManifest = await fastify.prisma.$transaction(async (tx) => {
      const updatedManifest = await fastify.prisma.manifest.update({
        where: { code: manifestCode },
        data: { status: ManifestStatus.Completed }
      })

      await tx.manifestLog.create({
        data: {
          manifestId: manifest.id,
          status: ManifestStatus.Completed
        }
      })

      return updatedManifest
    });

    return rep.status(200).send({
      message: 'Manifest completed.',
      data: updatedManifest
    })
  })

  fastify.patch(MANIFEST_PATHS.arrive, async (req, rep) => {
    const { manifestCode } = req.params as { manifestCode: string }

    const manifest = await fastify.prisma.manifest.findUniqueOrThrow({
      where: { code: manifestCode },
    })
    if (manifest.status !== ManifestStatus.Completed) {
      throw new Error(`Manifest cannot be set to arrive. Complete the parcel accumulation first.`)
    }

    const courierSchedule = await fastify.prisma.courierSchedule.findUniqueOrThrow({
      where: { id: manifest.courierScheduleId }
    })
    if (!courierSchedule.courierId) {
      throw new Error("Cannot dispatch manifest: No courier assigned to this schedule.");
    }
    const assignedCourierId = courierSchedule.courierId;

    const sector = await fastify.prisma.sector.findUniqueOrThrow({
      where: { id: manifest.sectorId }
    })

    const updatedManifest = await fastify.prisma.$transaction(async (tx) => {
      const updatedManifest = await fastify.prisma.manifest.update({
        where: { code: manifestCode },
        data: { status: ManifestStatus.Arrived }
      })

      await tx.manifestLog.create({
        data: {
          manifestId: manifest.id,
          status: ManifestStatus.Arrived
        }
      })

      await tx.dispatchLog.create({
        data: {
          assignedCourierId,
          originFacilityId: sector.localBranchId,
          arrivedAt: new Date(),
        }
      })

      await tx.courierLog.create({
        data: {
          courierId: assignedCourierId,
          status: CourierStatus.Available
        }
      })

      const updatedParcels = await tx.parcel.updateManyAndReturn({
        where: { manifestId: updatedManifest.id },
        data: { status: ShipmentStatus.ArrivedAtOriginHub }
      })
      const parcelIds = updatedParcels.map((p) => p.id)

      const facility = await tx.facility.findUniqueOrThrow({
        where: { id: sector.localBranchId }
      })

      await tx.trackingLog.createMany({
        data: parcelIds.map((parcelId) => ({
          parcelId,
          status: ShipmentStatus.ArrivedAtOriginHub,
          description: generateEventDescription({ status: ShipmentStatus.ArrivedAtOriginHub, hubName: facility.name }),
        })),
      });

      return updatedManifest
    });

    return rep.status(200).send({
      message: 'Manifested Parcels arrived.',
      data: updatedManifest
    })
  })
}