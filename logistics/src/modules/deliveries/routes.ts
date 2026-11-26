import { FastifyInstance } from "fastify";
import {
  CreateDeliveryBody,
  CreateDeliverySchema,
} from "./schema.js";
import { FleetTransportType, CourierStatus, DeliveryStatus, ParcelStatus } from "@prisma/client";
import { userAuth } from "#commons/middlewares/user-auth.js";
import { generateDeliveryCode } from "./service.js";
import { generateEventDescription } from "../parcel-logs (TBD)/logisticsEventDictionary.js";
import { deliveries } from "./paths.js";

export default async function routes(fastify: FastifyInstance) {
  fastify.get(deliveries.index, { preHandler: [userAuth] }, async (req, rep) => {
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
        "destination_sector_id" AS "destinationSectorId",
        COUNT(id)::int AS "totalCount",
        SUM(weight_grams)::int AS "totalWeightGrams",
        SUM(calculated_cbm)::float AS "totalCbm",
        SUM(declared_value)::float AS "totalDeclaredValue",
        array_agg(id) AS "parcelIds" 
      FROM parcels
      WHERE status = 'arrived_at_destination_hub'::shipment_status
        AND current_facility_id = ${facilityId}
        AND destination_sector_id = ANY(${sectorIds})
        AND delivery_id IS NULL
      GROUP BY "destination_sector_id"
    `;

    const physicalVehicles = await fastify.prisma.physicalVehicle.findMany({
      where: {
        assignedFacilityId: manager.assignedFacilityId,
        status: "Available"
      },
      include: { vehicleProfile: true }
    });

    const assignedVehicleIds = new Set<number>();

    const deliveriesBySector = sectorAggregates.map(sectorAgg => {
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
        originSectorId: sectorAgg.destinationSectorId,
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
        p.destination_sector_id AS "destinationSectorId",
        p.status,
        p.weight_grams AS "weightGrams",
        p.calculated_cbm AS "calculatedCbm",
        p.customer_name AS "customerName",
        ST_AsGeoJSON(p.customer_location)::json AS "location" 
      FROM parcels p
      WHERE p.status = 'arrived_at_destination_hub'::shipment_status
        AND p.current_facility_id = ${facilityId}
        AND p.destination_sector_id = ANY(${sectorIds})
        AND p.delivery_id IS NULL
    `;

    const pendingParcels = pendingParcelsRaw.map(p => ({
      ...p,
      location: p.location?.coordinates || null
    }));

    return rep.status(200).send({
      message: 'Deliveries retrieved.',
      data: {
        facility,
        availableVehicles: physicalVehicles,
        queue: deliveriesBySector,
        pendingParcels
      }
    })
  })

  fastify.post<{ Body: CreateDeliveryBody }>(deliveries.store, { schema: CreateDeliverySchema, preHandler: [userAuth] }, async (req, rep) => {
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
          scheduledFor: FleetTransportType.Delivery,
        },
      });

      const code = await generateDeliveryCode(fastify);
      const delivery = await tx.delivery.create({
        data: {
          sectorId,
          fleetTransportId: fleetTransport.id,
          code,
          currentWeightGrams,
          currentVolumeCbm,
        },
      });

      await tx.deliveryLog.create({
        data: {
          deliveryId: delivery.id,
        }
      })

      const updatedParcels = await tx.parcel.updateManyAndReturn({
        where: { id: { in: parcelIds } },
        data: { deliveryId: delivery.id },
      });

      return {
        delivery,
        fleetTransport,
        updatedParcels,
      };
    });

    return rep.status(201).send({
      message: 'Delivery created successfully.',
      data: {
        deliveryId: result.delivery.id,
        code: result.delivery.code,
        fleetTransportId: result.fleetTransport.id,
        fleetTransport: result.fleetTransport,
        totalParcels: result.updatedParcels.length,
        currentWeightGrams: result.delivery.currentWeightGrams,
        currentVolumeCbm: result.delivery.currentVolumeCbm,
      },
    })
  })

  fastify.patch(deliveries.dispatch.url, async (req, rep) => {
    const { code } = req.params as { code: string }

    const delivery = await fastify.prisma.delivery.findUniqueOrThrow({
      where: { code },
      include: { parcels: true }
    });

    const fleetTransport = await fastify.prisma.fleetTransport.findUniqueOrThrow({
      where: { id: delivery.fleetTransportId }
    })
    if (!fleetTransport.courierId) {
      throw new Error("Cannot dispatch delivery: No courier assigned to this schedule.");
    }
    const assignedCourierId = fleetTransport.courierId;
    const courierName = (await fastify.prisma.courier.findUniqueOrThrow({
      where: { id: assignedCourierId },
      include: { user: true }
    })).user.firstName

    const sector = await fastify.prisma.sector.findUniqueOrThrow({
      where: { id: delivery.sectorId }
    })

    const updatedDelivery = await fastify.prisma.$transaction(async (tx) => {
      const updatedDelivery = await tx.delivery.update({
        where: { id: delivery.id },
        data: { status: DeliveryStatus.Loading },
        include: { parcels: true }
      });
      const parcelIds = updatedDelivery.parcels.map((p) => p.id)

      await tx.deliveryLog.create({
        data: {
          deliveryId: delivery.id,
          status: DeliveryStatus.Loading
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

      await tx.parcel.updateMany({
        where: { id: { in: parcelIds } },
        data: {
          status: ParcelStatus.OutForDelivery
        }
      })

      await tx.parcelLog.createManyAndReturn({
        data: parcelIds.map((id) => ({
          parcelId: id,
          status: ParcelStatus.OutForDelivery,
          description: generateEventDescription({ status: ParcelStatus.OutForDelivery, courierName }),
          facilityId: sector.localBranchId,
          courierId: assignedCourierId
        }))
      })

      return updatedDelivery
    });

    return rep.status(200).send({
      message: 'Delivery dispatched.',
      data: updatedDelivery
    })
  })

  fastify.patch(deliveries.completed.url, async (req, rep) => {
    const { code } = req.params as { code: string }

    const delivery = await fastify.prisma.delivery.findUniqueOrThrow({
      where: { code },
    })
    const totalParcels = await fastify.prisma.parcel.aggregate({
      where: { deliveryId: delivery.id },
      _count: { id: true }
    })
    const totalPickedUpParcels = await fastify.prisma.parcel.aggregate({
      where: { deliveryId: delivery.id, status: ParcelStatus.Delivered },
      _count: { id: true }
    })
    const remainingParcels = totalParcels._count.id - totalPickedUpParcels._count.id
    if (remainingParcels) {
      throw new Error(`Delivery cannot be completed. There are ${remainingParcels} parcels left...`)
    }

    const updatedDelivery = await fastify.prisma.$transaction(async (tx) => {
      const updatedDelivery = await fastify.prisma.delivery.update({
        where: { code },
        data: { status: DeliveryStatus.Completed }
      })

      await tx.deliveryLog.create({
        data: {
          deliveryId: delivery.id,
          status: DeliveryStatus.Completed
        }
      })

      return updatedDelivery
    });

    return rep.status(200).send({
      message: 'Delivery completed.',
      data: updatedDelivery
    })
  })

  fastify.patch(deliveries.arrived.url, async (req, rep) => {
    const { code } = req.params as { code: string }

    const delivery = await fastify.prisma.delivery.findUniqueOrThrow({
      where: { code },
    })
    if (delivery.status !== DeliveryStatus.Completed) {
      throw new Error(`Delivery cannot be set to arrive. Complete the parcel distribution first.`)
    }

    const fleetTransport = await fastify.prisma.fleetTransport.findUniqueOrThrow({
      where: { id: delivery.fleetTransportId }
    })
    if (!fleetTransport.courierId) {
      throw new Error("Cannot dispatch delivery: No courier assigned to this schedule.");
    }
    const assignedCourierId = fleetTransport.courierId;
    
    const updatedDelivery = await fastify.prisma.$transaction(async (tx) => {
      const updatedDelivery = await fastify.prisma.delivery.update({
        where: { code },
        data: { status: DeliveryStatus.Arrived }
      })

      await tx.deliveryLog.create({
        data: {
          deliveryId: delivery.id,
          status: DeliveryStatus.Arrived
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
        where: { deliveryId: updatedDelivery.id },
        data: { status: ParcelStatus.ArrivedAtOriginHub }
      })


      return updatedDelivery
    });

    return rep.status(200).send({
      message: 'Distributor has arrived.',
      data: updatedDelivery
    })
  })
}