import { FastifyInstance } from "fastify";
import { TelemetryFleetTransportBody, UpdateFleetTransportBody } from "./schema.js";
import { UserRole, CourierStatus, MasterBagStatus, FleetTransportType, PhysicalVehicleStatus, ParcelStatus, PipelineStatus, ManifestStatus } from "@prisma/client";
import { generateParcelEventDescription } from "../parcels/state-machine.js";


export async function indexFleetTransport(fastify: FastifyInstance) {
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

export async function courierTasks(fastify: FastifyInstance, courierId: number) {
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

export async function schedules(fastify: FastifyInstance, facilityId: number) {
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

export async function storeFleetTransport(fastify: FastifyInstance, data: any) {
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

export async function showFleetTransport(fastify: FastifyInstance, id: number) {
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

export async function updateFleetTransport(fastify: FastifyInstance, id: number, data: UpdateFleetTransportBody) {
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

export async function deleteFleetTransport(fastify: FastifyInstance, id: number) {
  return await fastify.prisma.fleetTransport.delete({ where: { id } })
}

export async function dispatchFleetTransport(fastify: FastifyInstance, id: number) {
  const fleetTransport = await fastify.prisma.fleetTransport.update({
    where: { id },
    data: { dispatchedAt: new Date() },
    include: { vehicle: true, courier: true }
  })

  await fastify.prisma.$transaction(async (tx) => {
    const physicalVehicle = await tx.physicalVehicle.update({
      where: { id: fleetTransport.vehicleId },
      data: { status: PhysicalVehicleStatus.InTransit }
    })

    await tx.physicalVehicleLog.create({
      data: {
        physicalVehicleId: physicalVehicle.id,
        status: PhysicalVehicleStatus.InTransit
      }
    })
  })

  return fleetTransport
}

export async function arriveFleetTransport(fastify: FastifyInstance, id: number) {
  const fleetTranport = await fastify.prisma.fleetTransport.findUniqueOrThrow({ where: { id } })

  if (!fleetTranport.dispatchedAt) {
    throw { statusCode: 400, message: "Cannot arrive a run that hasn't been dispatched." };
  }

  return await fastify.prisma.fleetTransport.update({
    where: { id },
    data: { arrivedAt: new Date() }
  })
}

export async function returnFleetTransport(fastify: FastifyInstance, id: number) {
  const fleetTransport = await fastify.prisma.fleetTransport.findUnique({ where: { id } })

  if (!fleetTransport?.arrivedAt) {
    throw { statusCode: 400, message: "Cannot arrive a run that hasn't been arrived." }
  }

  return await fastify.prisma.$transaction(async (tx) => {
    const updatedFleetTransport = await fastify.prisma.fleetTransport.update({
      where: { id },
      data: { returnedAt: new Date() },
      include: { vehicle: true, courier: true }
    })

    const physicalVehicle = await tx.physicalVehicle.update({
      where: { id: updatedFleetTransport.vehicleId },
      data: { status: PhysicalVehicleStatus.Available }
    })

    await tx.physicalVehicleLog.create({
      data: {
        physicalVehicleId: physicalVehicle.id,
        status: PhysicalVehicleStatus.Available
      }
    })

    if (fleetTransport.courierId) {
      await fastify.prisma.courier.update({
        where: { id: fleetTransport.courierId },
        data: { status: CourierStatus.Available }
      })
    }

    return updatedFleetTransport
  })
}

export async function departFleetTransport(fastify: FastifyInstance, id: number) {
  const schedule = await fastify.prisma.fleetTransport.findUnique({
    where: { id },
    include: {
      facility: true,
      vehicle: true,
      networkLeg: {
        include: { destinationFacility: true }
      },
      manifest: {
        include: {
          parcels: {
            include: { store: true }
          }
        }
      },
      delivery: {
        include: {
          parcels: true
        }
      },
      masterBags: true
    }
  })
  console.log({ schedule })

  if (!schedule) {
    throw { statusCode: 404, message: 'Schedule not found.' }
  }

  if (schedule.scheduledFor === 'LineHaul') {
    if (!schedule.networkLeg) {
      throw { statusCode: 400, message: 'Line-Haul schedule must have an assigned Network Leg route.' }
    }

    // Get source facility location (Facility A)
    const sourceFacLoc: any = await fastify.prisma.$queryRaw`
          SELECT ST_X(location::geometry) as lng, ST_Y(location::geometry) as lat 
          FROM facilities WHERE id = ${schedule.facilityId}
        `.catch(() => [])

    const srcLng = sourceFacLoc[0]?.lng || 121.04
    const srcLat = sourceFacLoc[0]?.lat || 14.50

    const routeGeoRaw: any = await fastify.prisma.$queryRaw`
          SELECT ST_AsGeoJSON(route)::json as geo FROM network_legs WHERE id = ${schedule.networkLegId}
        `.catch(() => [])

    const routeGeometry = routeGeoRaw[0]?.geo || null

    await fastify.prisma.fleetTransport.update({
      where: { id: schedule.id },
      data: {
        route: routeGeometry,
        dispatchedAt: new Date(),
      }
    });

    const masterBagIds = schedule.masterBags.map(b => b.id)
    if (masterBagIds.length > 0) {
      const masterBags = await fastify.prisma.masterBag.updateManyAndReturn({
        where: { id: { in: masterBagIds } },
        data: { status: MasterBagStatus.Dispatched },
      })

      for (const bagId of masterBagIds) {
        await fastify.prisma.masterBagLog.create({
          data: {
            masterBagId: bagId,
            status: MasterBagStatus.Dispatched
          }
        })

        const masterBag = await fastify.prisma.masterBag.findUniqueOrThrow({
          where: { id: bagId },
          include: { parcels: true }
        })
        const inTransitParcels = masterBag.parcels

        for (const parcel of inTransitParcels) {
          await fastify.prisma.parcel.update({
            where: { id: parcel.id },
            data: { status: ParcelStatus.DepartedFromOriginHub }
          })

          await fastify.prisma.parcelLog.create({
            data: {
              parcelId: parcel.id,
              status: ParcelStatus.DepartedFromOriginHub,
              description: generateParcelEventDescription({ status: ParcelStatus.DepartedFromOriginHub, hubName: schedule.facility.name })
            }
          })

          await fastify.prisma.parcelFacilityPipeline.create({
            data: {
              parcelId: parcel.id,
              facilityId: schedule.facility.id,
              sequenceOrder: 3,
              status: PipelineStatus.Departed,
            }
          })

          await fastify.prisma.parcelFacilityPipeline.create({
            data: {
              parcelId: parcel.id,
              facilityId: schedule.networkLeg.destinationFacilityId,
            }
          })
        }
      }
    }

    // Record initial vehicle location log at Facility A
    await fastify.prisma.vehicleLocationLog.create({
      data: {
        physicalVehicleId: schedule.vehicleId,
        longitude: srcLng,
        latitude: srcLat,
        speed: 0,
        heading: 0
      }
    })

    return {
      message: 'Line-Haul departure confirmed and transit route loaded!',
      data: {
        status: 'InTransit',
        type: 'LineHaul',
        route: routeGeometry,
        distanceMeters: schedule.networkLeg.distanceMtr || 0,
        durationSeconds: schedule.networkLeg.baseTransitDuration || 0,
        destinationFacility: schedule.networkLeg.destinationFacility?.name || 'Destination Hub'
      }
    }
  }

  if (!schedule.manifest && !schedule.delivery) {
    throw { statusCode: 404, message: 'Schedule must be associated with a Manifest or Delivery.' }
  }

  const facilityLoc: any = await fastify.prisma.$queryRaw`
        SELECT ST_X(location::geometry) as lng, ST_Y(location::geometry) as lat 
        FROM facilities WHERE id = ${schedule.facilityId}
      `.catch(() => [])

  const facLng = facilityLoc[0]?.lng || 121.04
  const facLat = facilityLoc[0]?.lat || 14.50

  const isDelivery = !!schedule.delivery;
  const parcels = isDelivery ? schedule.delivery!.parcels : schedule.manifest!.parcels;

  let coordsMap: Record<number, { lng: number; lat: number; name?: string }> = {}

  if (isDelivery) {
    const parcelIds = parcels.map(p => p.id);
    if (parcelIds.length > 0) {
      const customersRaw: any = await fastify.prisma.$queryRaw`
            SELECT id, customer_name AS "name", ST_X(customer_location::geometry) as lng, ST_Y(customer_location::geometry) as lat 
            FROM parcels WHERE id = ANY(${parcelIds})
          `.catch(() => [])

      customersRaw.forEach((c: any) => {
        coordsMap[c.id] = { lng: c.lng, lat: c.lat, name: c.name }
      })
    }
  } else {
    const storeIds = [...new Set(parcels.map(p => p.storeId).filter(Boolean))]
    if (storeIds.length > 0) {
      const storesRaw: any = await fastify.prisma.$queryRaw`
            SELECT id, name, ST_X(location::geometry) as lng, ST_Y(location::geometry) as lat 
            FROM stores WHERE id = ANY(${storeIds})
          `.catch(() => [])

      storesRaw.forEach((s: any) => {
        coordsMap[s.id] = { lng: s.lng, lat: s.lat, name: s.name }
      })
    }
  }

  const coordinatesList = [`${facLng},${facLat}`]
  const stopDetails: any[] = []

  parcels.forEach(p => {
    const key = isDelivery ? p.id : p.storeId;
    if (!key) throw new Error('ParcelKeyNotFound')

    const targetCoord = coordsMap[key];

    if (targetCoord && targetCoord.lng && targetCoord.lat) {
      coordinatesList.push(`${targetCoord.lng},${targetCoord.lat}`)
      stopDetails.push({
        parcelId: p.id,
        trackingNumber: p.trackingNumber,
        ...(isDelivery ? { customerName: targetCoord.name } : { storeId: p.storeId, storeName: targetCoord.name }),
        lng: targetCoord.lng,
        lat: targetCoord.lat
      })
    }
  })

  coordinatesList.push(`${facLng},${facLat}`)

  let osrmRouteData = null
  try {
    const coordsString = coordinatesList.join(';')
    const osrmRes: any = await fetch(
      `https://router.project-osrm.org/trip/v1/driving/${coordsString}?source=first&roundtrip=true&overview=full&geometries=geojson`
    ).then(res => res.json())

    if (osrmRes.trips && osrmRes.trips.length > 0) {
      osrmRouteData = osrmRes.trips[0]
    } else if (osrmRes.routes && osrmRes.routes.length > 0) {
      osrmRouteData = osrmRes.routes[0]
    }
  } catch (err) {
    console.warn('OSRM Route calculation skipped/failed:', err)
  }

  await fastify.prisma.fleetTransport.update({
    where: { id: schedule.id },
    data: { route: osrmRouteData ? osrmRouteData.geometry : undefined }
  });

  if (isDelivery && schedule.delivery) {
    await fastify.prisma.delivery.update({
      where: { id: schedule.delivery.id },
      data: { status: 'Loading' }
    });
    await fastify.prisma.deliveryLog.create({
      data: {
        deliveryId: schedule.delivery.id,
        status: 'Loading'
      }
    });
  } else if (schedule.manifest) {
    await fastify.prisma.manifest.update({
      where: { id: schedule.manifest.id },
      data: { status: ManifestStatus.Accumulating }
    });
    await fastify.prisma.manifestLog.create({
      data: {
        manifestId: schedule.manifest.id,
        status: ManifestStatus.Accumulating
      }
    });
  }

  await fastify.prisma.vehicleLocationLog.create({
    data: {
      physicalVehicleId: schedule.vehicleId,
      longitude: facLng,
      latitude: facLat,
      speed: 0,
      heading: 0
    }
  })

  return {
    message: `${isDelivery ? 'Delivery' : 'Manifest'} multi-stop departure confirmed and route calculated!`,
    data: {
      status: isDelivery ? 'Loading' : 'Accumulating',
      route: osrmRouteData ? osrmRouteData.geometry : null,
      distanceMeters: osrmRouteData ? osrmRouteData.distance : 0,
      durationSeconds: osrmRouteData ? osrmRouteData.duration : 0,
      stops: stopDetails,
      facilityCoordinates: { lng: facLng, lat: facLat }
    }
  }
}


export async function recordTelemetryFleetTransport(fastify: FastifyInstance, id: number, data: TelemetryFleetTransportBody) {
  const { longitude, latitude, speed = 35, heading = 0 } = data;

  const schedule = await fastify.prisma.fleetTransport.findUnique({
    where: { id },
    select: { vehicleId: true }
  });

  if (!schedule) {
    throw { statusCode: 404, message: 'Schedule not found.' };
  }

  return await fastify.prisma.vehicleLocationLog.create({
    data: {
      physicalVehicleId: schedule.vehicleId,
      longitude,
      latitude,
      speed,
      heading
    }
  })
}