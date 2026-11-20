import { FastifyInstance } from "fastify";
import { UpdateBody } from "./schema.js";
import parseId from "#commons/utils/id-parser.js";
import { UserRole, CourierStatus, MasterBagStatus, FleetTransportType } from "@prisma/client";


export async function getFleetTransports(fastify: FastifyInstance) {
  const fleetTransports = await fastify.prisma.fleetTransport.findMany({
    include: {
      facility: true,
      courier: { include: { user: true } },
      vehicle: { include: { vehicleProfile: true } },
      manifest: {
        include: {
          parcels: {
            include: { store: true }
          }
        }
      },
      delivery: {
        include: {
          parcels: {
            include: { store: true }
          }
        }
      },
      masterBags: true,
    },
    orderBy: { scheduledTime: 'asc' }
  })

  const allStoreIds = [...new Set(fleetTransports.flatMap(ft => ft.manifest?.parcels.map(p => p.storeId).filter(Boolean) || []))]
  let storeCoordsMap: Record<number, { lng: number; lat: number }> = {}

  if (allStoreIds.length > 0) {
    const storesRaw: any = await fastify.prisma.$queryRaw`
          SELECT id, ST_X(location::geometry) as lng, ST_Y(location::geometry) as lat 
          FROM stores WHERE id = ANY(${allStoreIds})
        `.catch(() => [])

    storesRaw.forEach((s: any) => {
      storeCoordsMap[s.id] = { lng: s.lng, lat: s.lat }
    })
  }

  const allDeliveryParcelIds = [...new Set(fleetTransports.flatMap(ft => ft.delivery?.parcels.map(p => p.id) || []))]
  let customerCoordsMap: Record<number, { lng: number; lat: number }> = {}

  if (allDeliveryParcelIds.length > 0) {
    const customersRaw: any = await fastify.prisma.$queryRaw`
          SELECT id, ST_X(customer_location::geometry) as lng, ST_Y(customer_location::geometry) as lat 
          FROM parcels WHERE id = ANY(${allDeliveryParcelIds})
        `.catch(() => [])

    customersRaw.forEach((c: any) => {
      customerCoordsMap[c.id] = { lng: c.lng, lat: c.lat }
    })
  }

  const formattedData = fleetTransports.map(ft => {
    const isDelivery = ft.scheduledFor === 'Delivery';
    const targetParcels = isDelivery ? (ft.delivery?.parcels || []) : (ft.manifest?.parcels || []);

    return {
      id: ft.id,
      facilityId: ft.facilityId,
      vehicleId: ft.vehicleId,
      courierId: ft.courierId,
      networkLegId: ft.networkLegId,
      facilityName: ft.facility.name,
      email: ft.courier?.user.email || '-',
      courierName: ft.courier ? `${ft.courier.user.firstName} ${ft.courier.user.lastName}` : 'Unassigned',
      vehicleDetail: ft.vehicle ? `${ft.vehicle.vehicleProfile.modelName} (${ft.vehicle.plateNumber})` : 'Unassigned',
      scheduledFor: ft.scheduledFor,
      type: ft.scheduledFor,
      scheduledTime: ft.scheduledTime,
      manifestCodes: ft.manifest?.code,
      manifestStatus: ft.manifest?.status,
      deliveryCode: ft.delivery?.code,
      deliveryStatus: ft.delivery?.status,
      parcels: targetParcels.map(p => ({
        ...p,
        ...(isDelivery ? {
          customerLocation: {
            coordinates: customerCoordsMap[p.id] ? [customerCoordsMap[p.id].lng, customerCoordsMap[p.id].lat] : null
          }
        } : {
          store: p.storeId && storeCoordsMap[p.storeId] ? {
            ...p.store,
            location: {
              coordinates: [storeCoordsMap[p.storeId].lng, storeCoordsMap[p.storeId].lat]
            }
          } : null
        })
      })),
      masterBags: ft.masterBags || [],
      route: ft.route || null
    }
  })

  return formattedData
}

export async function getCourierTasks(fastify: FastifyInstance, courierId: number) {
  const fleetTransports = await fastify.prisma.fleetTransport.findMany({
    where: {
      courierId,
      // dispatchedAt: null,
      // arrivedAt: null,
    },
    include: {
      facility: true,
      courier: { include: { user: true } },
      vehicle: { include: { vehicleProfile: true } },
      manifest: {
        include: {
          parcels: {
            include: { store: true }
          }
        }
      },
      delivery: {
        include: {
          parcels: {
            include: { store: true }
          }
        }
      },
      masterBags: true,
    },
    orderBy: { scheduledTime: 'asc' }
  })

  const allStoreIds = [...new Set(fleetTransports.flatMap(ft => ft.manifest?.parcels.map(p => p.storeId).filter(Boolean) || []))]
  let storeCoordsMap: Record<number, { lng: number; lat: number }> = {}

  if (allStoreIds.length > 0) {
    const storesRaw: any = await fastify.prisma.$queryRaw`
          SELECT id, ST_X(location::geometry) as lng, ST_Y(location::geometry) as lat 
          FROM stores WHERE id = ANY(${allStoreIds})
        `.catch(() => [])

    storesRaw.forEach((s: any) => {
      storeCoordsMap[s.id] = { lng: s.lng, lat: s.lat }
    })
  }

  const allDeliveryParcelIds = [...new Set(fleetTransports.flatMap(ft => ft.delivery?.parcels.map(p => p.id) || []))]
  let customerCoordsMap: Record<number, { lng: number; lat: number }> = {}

  if (allDeliveryParcelIds.length > 0) {
    const customersRaw: any = await fastify.prisma.$queryRaw`
          SELECT id, ST_X(customer_location::geometry) as lng, ST_Y(customer_location::geometry) as lat 
          FROM parcels WHERE id = ANY(${allDeliveryParcelIds})
        `.catch(() => [])

    customersRaw.forEach((c: any) => {
      customerCoordsMap[c.id] = { lng: c.lng, lat: c.lat }
    })
  }

  const formattedData = fleetTransports.map(ft => {
    const isDelivery = ft.scheduledFor === 'Delivery';
    const targetParcels = isDelivery ? (ft.delivery?.parcels || []) : (ft.manifest?.parcels || []);

    return {
      id: ft.id,
      facilityName: ft.facility.name,
      email: ft.courier?.user.email || '-',
      courierName: ft.courier ? `${ft.courier.user.firstName} ${ft.courier.user.lastName}` : 'Unassigned',
      vehicleDetail: ft.vehicle ? `${ft.vehicle.vehicleProfile.modelName} (${ft.vehicle.plateNumber})` : 'Unassigned',
      scheduledFor: ft.scheduledFor,
      type: ft.scheduledFor,
      scheduledTime: ft.scheduledTime,
      manifestCodes: ft.manifest?.code,
      manifestStatus: ft.manifest?.status,
      deliveryCode: ft.delivery?.code,
      deliveryStatus: ft.delivery?.status,
      parcels: targetParcels.map(p => ({
        ...p,
        ...(isDelivery ? {
          customerLocation: {
            coordinates: customerCoordsMap[p.id] ? [customerCoordsMap[p.id].lng, customerCoordsMap[p.id].lat] : null
          }
        } : {
          store: p.storeId && storeCoordsMap[p.storeId] ? {
            ...p.store,
            location: {
              coordinates: [storeCoordsMap[p.storeId].lng, storeCoordsMap[p.storeId].lat]
            }
          } : null
        })
      })),
      masterBags: ft.masterBags || [],
      route: ft.route || null
    }
  })

  return formattedData
}

export async function getFacilitySchedules(fastify: FastifyInstance, facilityId: number) {
  const fleetTransports = await fastify.prisma.fleetTransport.findMany({
    where: {
      facilityId,
    },
    include: {
      facility: true,
      courier: { include: { user: true } },
      vehicle: { include: { vehicleProfile: true } },
      manifest: true,
      delivery: true,
    },
    orderBy: { scheduledTime: 'asc' }
  })

  const formattedData = fleetTransports.map(ft => {
    return {
      id: ft.id,
      facilityName: ft.facility.name,
      email: ft.courier?.user.email || '-',
      courierName: ft.courier ? `${ft.courier.user.firstName} ${ft.courier.user.lastName}` : 'Unassigned',
      vehicleDetail: ft.vehicle ? `${ft.vehicle.vehicleProfile.modelName} (${ft.vehicle.plateNumber})` : 'Unassigned',
      scheduledFor: ft.scheduledFor,
      type: ft.scheduledFor,
      scheduledTime: ft.scheduledTime,
      manifestCodes: ft.manifest?.code,
      manifestStatus: ft.manifest?.status,
      deliveryCode: ft.delivery?.code,
      deliveryStatus: ft.delivery?.status,
    }
  })

  return formattedData
}

export async function getCreateData(fastify: FastifyInstance, facilityId?: number) {
  console.log({ facilityId })
  const fleetTransportTypes = Object.values(FleetTransportType)

  const facilityFilter = facilityId ? { assignedFacilityId: facilityId } : {};
  const vehicleFacilityFilter = facilityId ? { assignedFacilityId: facilityId } : {};
  const legFacilityFilter = facilityId ? { sourceFacilityId: facilityId } : {};
  const bagFacilityFilter = facilityId ? { currentFacilityId: facilityId } : {};

  const [couriers, vehicles, legs, masterBags] = await Promise.all([
    fastify.prisma.user.findMany({
      where: { ...facilityFilter, role: UserRole.Courier },
      include: { courier: true }
    }),
    fastify.prisma.physicalVehicle.findMany({
      where: { ...vehicleFacilityFilter, status: CourierStatus.Available },
      include: { vehicleProfile: true }
    }),
    fastify.prisma.networkLeg.findMany({
      where: { ...legFacilityFilter },
      include: { destinationFacility: true }
    }),
    fastify.prisma.masterBag.findMany({
      where: { ...bagFacilityFilter, status: MasterBagStatus.Sealed },
      include: { nextFacility: true }
    })
  ]);

  return { fleetTransportTypes, couriers, vehicles, legs, masterBags };
}

export async function createFleetTransport(fastify: FastifyInstance, data: any) {
  const { masterBagIds, ...scheduleData } = data;

  return await fastify.prisma.$transaction(async (tx) => {
    const fleetTransport = await tx.fleetTransport.create({
      data: scheduleData,
    })

    if (masterBagIds && masterBagIds.length > 0) {
      await tx.masterBag.updateMany({
        where: { id: { in: masterBagIds } },
        data: { courierScheduleId: fleetTransport.id }
      })
    }

    return fleetTransport;
  })
}

export async function getFleetTransportById(fastify: FastifyInstance, idParam: string) {
  const id = parseId(idParam)
  const fleetTransport = await fastify.prisma.fleetTransport.findUnique({
    where: { id },
    include: {
      facility: true,
      courier: {
        include: { user: true }
      },
      vehicle: {
        include: { vehicleProfile: true }
      },
      networkLeg: {
        include: {
          sourceFacility: true,
          destinationFacility: true,
        }
      },
      manifest: true,
      delivery: true,
      masterBags: true
    }
  });

  if (!fleetTransport) {
    throw { statusCode: 404, message: 'Fleet Transport not found.' };
  }

  return fleetTransport;
}

export async function updateFleetTransport(
  fastify: FastifyInstance,
  idParam: string,
  data: UpdateBody
) {
  const id = parseId(idParam)
  const { courierId, vehicleId, networkLegId, scheduledTime, scheduledFor } = data

  return await fastify.prisma.fleetTransport.update({
    where: { id },
    data: {
      ...(scheduledFor && { scheduledFor }),
      ...(courierId !== undefined && { courierId: courierId ?? null }),
      ...(vehicleId && { vehicleId }),
      ...(networkLegId !== undefined && { networkLegId: networkLegId ?? null }),
      ...(scheduledTime && { scheduledTime }),
    },
  })
}

export async function deleteFleetTransport(
  fastify: FastifyInstance,
  idParam: string
) {
  const id = parseId(idParam)

  return await fastify.prisma.fleetTransport.delete({
    where: { id },
  })
}

export async function dispatchFleetTransport(fastify: FastifyInstance, idParam: string) {
  const id = parseId(idParam)

  const run = await fastify.prisma.fleetTransport.update({
    where: { id },
    data: {
      dispatchedAt: new Date(),
    },
    include: { vehicle: true, courier: true }
  });

  await fastify.prisma.physicalVehicle.update({
    where: { id: run.vehicleId },
    data: { status: 'Transit' }
  });

  return run;
}

export async function arriveFleetTransport(fastify: FastifyInstance, idParam: string) {
  const id = parseId(idParam)

  const check = await fastify.prisma.fleetTransport.findUnique({ where: { id } });
  if (!check?.dispatchedAt) {
    throw { statusCode: 400, message: "Cannot arrive a run that hasn't been dispatched." };
  }

  const run = await fastify.prisma.fleetTransport.update({
    where: { id },
    data: { arrivedAt: new Date() },
    include: { vehicle: true, courier: true }
  });

  await fastify.prisma.physicalVehicle.update({
    where: { id: run.vehicleId },
    data: { status: 'Available' }
  });

  if (run.courierId) {
    await fastify.prisma.courier.update({
      where: { id: run.courierId },
      data: { status: 'Available' }
    });
  }

  return run;
}

export async function recordTelemetry(
  fastify: FastifyInstance,
  idParam: string,
  data: { longitude: number; latitude: number; speed?: number; heading?: number }
) {
  const id = parseId(idParam)
  const { longitude, latitude, speed = 35, heading = 0 } = data;

  const schedule = await fastify.prisma.fleetTransport.findUnique({
    where: { id },
    select: { vehicleId: true }
  });

  if (!schedule) {
    throw { statusCode: 404, message: 'Schedule not found.' };
  }

  const vehicleLog = await fastify.prisma.vehicleLocationLog.create({
    data: {
      physicalVehicleId: schedule.vehicleId,
      longitude,
      latitude,
      speed,
      heading
    }
  });

  return {
    ...vehicleLog,
    id: Number(vehicleLog.id)
  };
}