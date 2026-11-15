import { FastifyInstance } from "fastify";
import {
  CreateManifestBody,
  CreateManifestSchema,
} from "./schema.js";
import { CourierStatus, ManifestStatus, ShipmentStatus } from "@prisma/client";
import { userAuth } from "#commons/middlewares/user-auth.js";
import { generateManifestCode } from "./service.js";
import { generateEventDescription } from "../tracking-logs/logisticsEventDictionary.js";
import { manifests } from "./paths.js";

export default async function routes(fastify: FastifyInstance) {
  fastify.get(manifests.index, { preHandler: [userAuth] }, async (req, rep) => {
    const manager = (req as any).user

    const facilityId = manager.assignedFacilityId;

    const [facilityRaw]: any[] = await fastify.prisma.$queryRaw`
      SELECT id, name, code, address, type, parent_id AS "parentId", ST_AsGeoJSON(location)::json AS location
      FROM facilities WHERE id = ${facilityId}
    `;

    const sectorsRaw: any[] = await fastify.prisma.$queryRaw`
      SELECT id, code, local_branch_id AS "localBranchId", ST_AsGeoJSON(zone)::json AS zone
      FROM sectors WHERE local_branch_id = ${facilityId}
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
      WHERE status = 'ready_for_pickup'::shipment_status
        AND current_facility_id IS NULL
        AND origin_sector_id = ANY(${sectorIds})
        AND manifest_id IS NULL
      GROUP BY "origin_sector_id"
    `;

    const physicalVehicles = await fastify.prisma.physicalVehicle.findMany({
      where: {
        assignedFacilityId: manager.assignedFacilityId,
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
        assignedVehicleIds.add(selectedVehicle.id); // Mark as used so next sector picks a different vehicle
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
      WHERE p.status = 'ready_for_pickup'::shipment_status
        AND p.current_facility_id IS NULL
        AND p.origin_facility_id = ${facilityId}
        AND p.manifest_id IS NULL
    `;

    const pendingParcels = pendingParcelsRaw.map(p => ({
      ...p,
      location: p.location?.coordinates || null
    }));

    return rep.status(200).send({
      message: 'Manifests retrieved.',
      data: {
        facility,
        availableVehicles: physicalVehicles,
        queue: manifestsBySector,
        pendingParcels
      }
    })
  })

  fastify.post<{ Body: CreateManifestBody }>(
    manifests.store,
    {
      schema: CreateManifestSchema,
      preHandler: [userAuth]
    },
    async (req, rep) => {
      const { sectorId, courierId, vehicleId, scheduledTime, parcelIds, currentWeightGrams, currentVolumeCbm } = req.body;
      const manager = (req as any).user
      const sanitizedCourierId = (courierId === 0 || !courierId) ? null : courierId;

      const result = await fastify.prisma.$transaction(async (tx) => {
        const fleetTransport = await tx.fleetTransport.create({
          data: {
            facilityId: manager.assignedFacilityId,
            courierId: sanitizedCourierId,
            vehicleId,
            scheduledTime: new Date(scheduledTime),
          },
        });

        const code = await generateManifestCode(fastify);
        const manifest = await tx.manifest.create({
          data: {
            sectorId,
            courierScheduleId: fleetTransport.id,
            code,
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
          fleetTransport,
          updatedParcels,
        };
      });

      return rep.status(201).send({
        message: 'Manifest created successfully.',
        data: {
          manifestId: result.manifest.id,
          code: result.manifest.code,
          courierScheduleId: result.fleetTransport.id,
          fleetTransport: result.fleetTransport,
          totalParcels: result.updatedParcels.length,
          currentWeightGrams: result.manifest.currentWeightGrams,
          currentVolumeCbm: result.manifest.currentVolumeCbm,
        },
      })
    })

  fastify.patch(manifests.dispatch.url, { preHandler: [userAuth] }, async (req, rep) => {
    const { code } = req.params as { code: string }

    const manifest = await fastify.prisma.manifest.findUniqueOrThrow({
      where: { code },
      include: { parcels: true }
    });

    const fleetTransport = await fastify.prisma.fleetTransport.findUniqueOrThrow({
      where: { id: manifest.courierScheduleId }
    })
    if (!fleetTransport.courierId) {
      throw new Error("Cannot dispatch manifest: No courier assigned to this schedule.");
    }
    const assignedCourierId = fleetTransport.courierId;

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

      await tx.fleetTransport.update({
        where: { id: fleetTransport.id },
        data: {
          dispatchedAt: new Date(),
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

  fastify.patch(manifests.complete.url, { preHandler: [userAuth] }, async (req, rep) => {
    const { code } = req.params as { code: string }

    const manifest = await fastify.prisma.manifest.findUniqueOrThrow({
      where: { code },
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

    const fleetTransport = await fastify.prisma.fleetTransport.findUniqueOrThrow({
      where: { id: manifest.courierScheduleId }
    })
    if (!fleetTransport.courierId) {
      throw new Error("Cannot dispatch manifest: No courier assigned to this schedule.");
    }

    const updatedManifest = await fastify.prisma.$transaction(async (tx) => {
      const updatedManifest = await fastify.prisma.manifest.update({
        where: { code },
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

  fastify.patch(manifests.arrive.url, { preHandler: [userAuth] }, async (req, rep) => {
    const { code } = req.params as { code: string }

    const manifest = await fastify.prisma.manifest.findUniqueOrThrow({
      where: { code },
    })
    if (manifest.status !== ManifestStatus.Completed) {
      throw new Error(`Manifest cannot be set to arrive. Complete the parcel accumulation first.`)
    }

    const fleetTransport = await fastify.prisma.fleetTransport.findUniqueOrThrow({
      where: { id: manifest.courierScheduleId }
    })
    if (!fleetTransport.courierId) {
      throw new Error("Cannot dispatch manifest: No courier assigned to this schedule.");
    }
    const assignedCourierId = fleetTransport.courierId;

    const sector = await fastify.prisma.sector.findUniqueOrThrow({
      where: { id: manifest.sectorId }
    })

    const facilityId = sector.localBranchId;

    const updatedManifest = await fastify.prisma.$transaction(async (tx) => {
      const updatedManifest = await fastify.prisma.manifest.update({
        where: { code },
        data: { status: ManifestStatus.Arrived }
      })

      await tx.manifestLog.create({
        data: {
          manifestId: manifest.id,
          status: ManifestStatus.Arrived
        }
      })

      await tx.fleetTransport.update({
        where: { id: fleetTransport.id },
        data: {
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
        data: {
          status: ShipmentStatus.ArrivedAtOriginHub,
          currentFacilityId: facilityId
        }
      })
      const parcelIds = updatedParcels.map((p) => p.id)

      const facility = await tx.facility.findUniqueOrThrow({
        where: { id: facilityId }
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