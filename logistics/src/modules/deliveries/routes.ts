import { FastifyInstance } from "fastify";
import {
  CreateDeliveryBody,
  CreateDeliverySchema,
  DELIVERY_PATHS,
} from "./schema.js";
import { CourierScheduleType, CourierStatus, DeliveryStatus, ShipmentStatus } from "@prisma/client";
import { userAuth } from "#commons/middlewares/user-auth.js";
import { generateDeliveryCode } from "./service.js";
import { generateEventDescription } from "../tracking-logs/logisticsEventDictionary.js";

export default async function deliveryRoutes(fastify: FastifyInstance) {
  // TODO: Middleware to check and get the Manager Data to get its assigned facility
  fastify.get(DELIVERY_PATHS.index, { preHandler: [userAuth] }, async (req, rep) => {
    const manager = (req as any).user

    const facility = await fastify.prisma.facility.findUniqueOrThrow({
      where: { id: manager.assignedFacilityId },
      include: { sectors: true }
    })

    console.log(facility)

    const sectorIds = facility.sectors.map(s => s.id);
    const sectorAggregates = await fastify.prisma.parcel.groupBy({
      by: ['originSectorId'],
      where: {
        status: ShipmentStatus.ArrivedAtDestinationHub,
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

    const deliveriesBySector = sectorAggregates.map(sectorAgg => {
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
      message: 'Deliveries retrieved.',
      data: deliveriesBySector
    })
  })

  fastify.post<{ Body: CreateDeliveryBody }>(DELIVERY_PATHS.store, { schema: CreateDeliverySchema }, async (req, rep) => {
    const { sectorId, courierId, vehicleId, scheduledTime, parcelIds, currentWeightGrams, currentVolumeCbm } = req.body;

    const result = await fastify.prisma.$transaction(async (tx) => {
      const courierSchedule = await tx.courierSchedule.create({
        data: {
          courierId: courierId ?? null,
          vehicleId,
          scheduledTime: new Date(scheduledTime),
          scheduledFor: CourierScheduleType.Delivery
        },
      });

      const deliveryCode = await generateDeliveryCode(fastify);
      const delivery = await tx.delivery.create({
        data: {
          sectorId,
          courierScheduleId: courierSchedule.id,
          code: deliveryCode,
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
        courierSchedule,
        updatedParcels,
      };
    });

    return rep.status(201).send({
      message: 'Delivery created successfully.',
      data: {
        deliveryId: result.delivery.id,
        code: result.delivery.code,
        courierScheduleId: result.courierSchedule.id,
        courierSchedule: result.courierSchedule,
        totalParcels: result.updatedParcels.length,
        currentWeightGrams: result.delivery.currentWeightGrams,
        currentVolumeCbm: result.delivery.currentVolumeCbm,
      },
    })
  })

  fastify.patch(DELIVERY_PATHS.dispatch, async (req, rep) => {
    const { deliveryCode } = req.params as { deliveryCode: string }

    const delivery = await fastify.prisma.delivery.findUniqueOrThrow({
      where: { code: deliveryCode },
      include: { parcels: true }
    });

    const courierSchedule = await fastify.prisma.courierSchedule.findUniqueOrThrow({
      where: { id: delivery.courierScheduleId }
    })
    if (!courierSchedule.courierId) {
      throw new Error("Cannot dispatch delivery: No courier assigned to this schedule.");
    }
    const assignedCourierId = courierSchedule.courierId;
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

      await tx.parcel.updateMany({
        where: { id: { in: parcelIds } },
        data: {
          status: ShipmentStatus.OutForDelivery
        }
      })

      await tx.trackingLog.createManyAndReturn({
        data: parcelIds.map((id) => ({
          parcelId: id,
          status: ShipmentStatus.OutForDelivery,
          description: generateEventDescription({ status: ShipmentStatus.OutForDelivery, courierName }),
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

  fastify.patch(DELIVERY_PATHS.completed, async (req, rep) => {
    const { deliveryCode } = req.params as { deliveryCode: string }

    const delivery = await fastify.prisma.delivery.findUniqueOrThrow({
      where: { code: deliveryCode },
    })
    const totalParcels = await fastify.prisma.parcel.aggregate({
      where: { deliveryId: delivery.id },
      _count: { id: true }
    })
    const totalPickedUpParcels = await fastify.prisma.parcel.aggregate({
      where: { deliveryId: delivery.id, status: ShipmentStatus.Delivered },
      _count: { id: true }
    })
    const remainingParcels = totalParcels._count.id - totalPickedUpParcels._count.id
    if (remainingParcels) {
      throw new Error(`Delivery cannot be completed. There are ${remainingParcels} parcels left...`)
    }

    const updatedDelivery = await fastify.prisma.$transaction(async (tx) => {
      const updatedDelivery = await fastify.prisma.delivery.update({
        where: { code: deliveryCode },
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

  fastify.patch(DELIVERY_PATHS.arrived, async (req, rep) => {
    const { deliveryCode } = req.params as { deliveryCode: string }

    const delivery = await fastify.prisma.delivery.findUniqueOrThrow({
      where: { code: deliveryCode },
    })
    if (delivery.status !== DeliveryStatus.Completed) {
      throw new Error(`Delivery cannot be set to arrive. Complete the parcel distribution first.`)
    }

    const courierSchedule = await fastify.prisma.courierSchedule.findUniqueOrThrow({
      where: { id: delivery.courierScheduleId }
    })
    if (!courierSchedule.courierId) {
      throw new Error("Cannot dispatch delivery: No courier assigned to this schedule.");
    }
    const assignedCourierId = courierSchedule.courierId;

    const sector = await fastify.prisma.sector.findUniqueOrThrow({
      where: { id: delivery.sectorId }
    })

    const updatedDelivery = await fastify.prisma.$transaction(async (tx) => {
      const updatedDelivery = await fastify.prisma.delivery.update({
        where: { code: deliveryCode },
        data: { status: DeliveryStatus.Arrived }
      })

      await tx.deliveryLog.create({
        data: {
          deliveryId: delivery.id,
          status: DeliveryStatus.Arrived
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
        where: { deliveryId: updatedDelivery.id },
        data: { status: ShipmentStatus.ArrivedAtOriginHub }
      })


      return updatedDelivery
    });

    return rep.status(200).send({
      message: 'Distributor has arrived.',
      data: updatedDelivery
    })
  })
}