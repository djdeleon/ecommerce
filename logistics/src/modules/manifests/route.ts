import { FastifyInstance } from "fastify";
import {
  CreateManifestBody,
  CreateManifestSchema,
  MANIFEST_PATHS
} from "./schema.js";
import { ShipmentStatus, UserRole } from "@prisma/client";
import { userAuth } from "#commons/middlewares/user-auth.js";
import { generateManifestCode } from "./service.js";

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
    const { sectorId, vehicleId, parcelIds, currentWeightGrams, currentVolumeCbm } = req.body;

    const result = await fastify.prisma.$transaction(async (tx) => {
      const courierSchedule = await tx.courierSchedule.create({
        data: { vehicleId },
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
}