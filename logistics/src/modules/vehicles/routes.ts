import { FastifyInstance } from "fastify";
import { CreateVehicleProfile, CreateVehicleSchema, DeleteVehicleParams, DeleteVehicleSchema, UpdateVehicleBody, UpdateVehicleParams, UpdateVehicleSchema } from "./schemas/vehicle-profile.schema.js";
import { CreatePhysicalVehicleBody, CreatePhysicalVehicleSchema, DeletePhysicalVehicleParams, DeletePhysicalVehicleSchema, UpdatePhysicalVehicleBody, UpdatePhysicalVehicleParams, UpdatePhysicalVehicleSchema } from "./schemas/physical-vehicle.schema.js";
import { CreateCourierScheduleBody, CreateCourierScheduleSchema, DeleteCourierScheduleParams, DeleteCourierScheduleSchema, UpdateCourierScheduleBody, UpdateCourierScheduleParams, UpdateCourierScheduleSchema } from "./schemas/courier-schedule.schema.js";
import { createVehicleProfile, deleteVehicleProfile, updateVehicleProfile } from "./services/vehicle-profile.service.js";
import { createPhysicalVehicle, deletePhysicalVehicle, updatePhysicalVehicle } from "./services/physical-vehicle.service.js";
import { createCourierSchedule, deleteCourierSchedule, updateCourierSchedule } from "./services/courier-schedule.service.js";
import { CreateDispatchLogBody, CreateDispatchLogSchema, UpdateDispatchLogBody, UpdateDispatchLogParams, UpdateDispatchLogSchema, DeleteDispatchLogParams, DeleteDispatchLogSchema } from "./schemas/dispatch-log.schema.js";
import { createDispatchLog, updateDispatchLog, deleteDispatchLog } from "./services/dispatch-log.service.js";
import { vehicles } from "./paths.js";
import { userAuth } from "#commons/middlewares/user-auth.js";
import { ManifestStatus, MasterBagStatus } from "@prisma/client";

export async function vehicleProfileRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: CreateVehicleProfile }>(vehicles.vehicleProfiles.store, { schema: CreateVehicleSchema }, async (req, rep) => {
    const vehicleProfile = await createVehicleProfile(fastify, req.body)

    return rep.code(201).send({
      message: 'Vehicle profile created successfully',
      data: vehicleProfile,
    })
  })

  fastify.put<{ Body: UpdateVehicleBody; Params: UpdateVehicleParams }>(
    vehicles.vehicleProfiles.update.url,
    { schema: UpdateVehicleSchema },
    async (req, rep) => {
      const { vehicleProfileId } = req.params

      const updatedProfile = await updateVehicleProfile(fastify, vehicleProfileId, req.body)

      return rep.code(200).send({
        message: 'Vehicle profile updated successfully',
        data: updatedProfile,
      })
    }
  )

  fastify.delete<{ Params: DeleteVehicleParams }>(
    vehicles.vehicleProfiles.delete.url,
    { schema: DeleteVehicleSchema },
    async (req, rep) => {
      const { vehicleProfileId } = req.params

      await deleteVehicleProfile(fastify, vehicleProfileId)

      return rep.code(200).send({
        message: 'Vehicle profile deleted successfully',
      })
    }
  )
}

export async function physicalVehicleRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: CreatePhysicalVehicleBody }>(
    vehicles.physicalVehicles.store,
    { schema: CreatePhysicalVehicleSchema },
    async (req, rep) => {
      const physicalVehicle = await createPhysicalVehicle(fastify, req.body)

      return rep.code(201).send({
        message: 'Physical vehicle created successfully',
        data: physicalVehicle,
      })
    }
  )

  fastify.put<{ Body: UpdatePhysicalVehicleBody; Params: UpdatePhysicalVehicleParams }>(
    vehicles.physicalVehicles.update.url,
    { schema: UpdatePhysicalVehicleSchema },
    async (req, rep) => {
      const { physicalVehicleId } = req.params

      const updatedVehicle = await updatePhysicalVehicle(fastify, physicalVehicleId, req.body)

      return rep.code(200).send({
        message: 'Physical vehicle updated successfully',
        data: updatedVehicle,
      })
    }
  )

  fastify.delete<{ Params: DeletePhysicalVehicleParams }>(
    vehicles.physicalVehicles.delete.url,
    { schema: DeletePhysicalVehicleSchema },
    async (req, rep) => {
      const { physicalVehicleId } = req.params

      await deletePhysicalVehicle(fastify, physicalVehicleId)

      return rep.code(200).send({
        message: 'Physical vehicle deleted successfully',
      })
    }
  )
}

export async function courierScheduleRoutes(fastify: FastifyInstance) {
  fastify.get(vehicles.courierSchedules.index, {
    preHandler: [userAuth]
  }, async (req, rep) => {
    const user = (req as any).user
    const where: any = {}

    if (user.courier) {
      where.courierId = user.courier.id
    } else if (user.assignedFacilityId) {
      // Fallback for facility managers
      where.facilityId = user.assignedFacilityId
    }

    const courierSchedules = await fastify.prisma.courierSchedule.findMany({
      where,
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
        masterBags: true,
      },
      orderBy: { scheduledTime: 'asc' }
    })

    const allStoreIds = [...new Set(courierSchedules.flatMap(s => s.manifest?.parcels.map(p => p.storeId).filter(Boolean) || []))]
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

    const formattedSchedules = courierSchedules.map(s => ({
      id: s.id,
      facilityName: s.facility.name,
      email: s.courier?.user.email || '-',
      courierName: s.courier ? `${s.courier.user.firstName} ${s.courier.user.lastName}` : 'Unassigned',
      vehicleDetail: s.vehicle ? `${s.vehicle.vehicleProfile.modelName} (${s.vehicle.plateNumber})` : 'Unassigned',
      scheduledFor: s.scheduledFor,
      type: s.scheduledFor,
      scheduledTime: s.scheduledTime,
      manifestCodes: s.manifest?.code,
      manifestStatus: s.manifest?.status,
      parcels: (s.manifest?.parcels || []).map(p => ({
        ...p,
        store: p.store ? {
          ...p.store,
          location: {
            coordinates: storeCoordsMap[p.storeId] ? [storeCoordsMap[p.storeId].lng, storeCoordsMap[p.storeId].lat] : null
          }
        } : null
      })),
      masterBags: s.masterBags || [],
      route: s.route || null
    }))

    return rep.status(200).send({
      message: 'Courier Schedules retrieved.',
      data: formattedSchedules
    })
  })

  fastify.post<{ Body: CreateCourierScheduleBody }>(
    vehicles.courierSchedules.store,
    {
      schema: CreateCourierScheduleSchema,
      preHandler: [userAuth]
    },
    async (req, rep) => {
      const manager = (req as any).user
      const payload = {
        ...req.body,
        facilityId: manager.assignedFacilityId,
      }

      const courierSchedule = await createCourierSchedule(fastify, payload)

      return rep.code(201).send({
        message: 'Courier schedule created successfully.',
        data: courierSchedule,
      })
    }
  )

  fastify.put<{ Body: UpdateCourierScheduleBody; Params: UpdateCourierScheduleParams }>(
    vehicles.courierSchedules.update.url,
    {
      schema: UpdateCourierScheduleSchema,
      preHandler: [userAuth]
    },
    async (req, rep) => {
      const { courierScheduleId } = req.params

      const updatedCourierSchedule = await updateCourierSchedule(fastify, courierScheduleId, req.body)

      return rep.code(200).send({
        message: 'Courier schedule updated successfully.',
        data: updatedCourierSchedule,
      })
    }
  )

  fastify.delete<{ Params: DeleteCourierScheduleParams }>(
    vehicles.courierSchedules.delete.url,
    { schema: DeleteCourierScheduleSchema },
    async (req, rep) => {
      const { courierScheduleId } = req.params

      await deleteCourierSchedule(fastify, courierScheduleId)

      return rep.code(200).send({
        message: 'Courier schedule deleted successfully.',
      })
    }
  )

  fastify.post<{ Params: { courierScheduleId: string } }>(vehicles.courierSchedules.depart.url,
    { preHandler: [userAuth] },
    async (req, rep) => {
      const { courierScheduleId } = req.params;

      const schedule = await fastify.prisma.courierSchedule.findUnique({
        where: { id: parseInt(courierScheduleId) },
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
          masterBags: true
        }
      })
      console.log({ schedule })

      if (!schedule) {
        return rep.code(404).send({ message: 'Schedule or Manifest not found' })
      }

      if (schedule.scheduledFor === 'LineHaul') {
        if (!schedule.networkLeg) {
          return rep.code(400).send({ message: 'Line-Haul schedule must have an assigned Network Leg route.' })
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

        await fastify.prisma.courierSchedule.update({
          where: { id: schedule.id },
          data: { route: routeGeometry }
        });

        const masterBagIds = schedule.masterBags.map(b => b.id)
        if (masterBagIds.length > 0) {
          await fastify.prisma.masterBag.updateMany({
            where: { id: { in: masterBagIds } },
            data: { status: MasterBagStatus.Dispatched }
          })

          for (const bagId of masterBagIds) {
            await fastify.prisma.masterBagLog.create({
              data: {
                masterBagId: bagId,
                status: MasterBagStatus.Dispatched
              }
            })
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

        return rep.code(200).send({
          message: 'Line-Haul departure confirmed and transit route loaded!',
          data: {
            status: 'InTransit',
            type: 'LineHaul',
            route: routeGeometry,
            distanceMeters: schedule.networkLeg.distanceMtr || 0,
            durationSeconds: schedule.networkLeg.baseTransitDuration || 0,
            destinationFacility: schedule.networkLeg.destinationFacility?.name || 'Destination Hub'
          }
        });
      }

      if (!schedule || !schedule.manifest) {
        return rep.code(404).send({ message: 'Schedule or Manifest not found' })
      }

      const facilityLoc: any = await fastify.prisma.$queryRaw`
        SELECT ST_X(location::geometry) as lng, ST_Y(location::geometry) as lat 
        FROM facilities WHERE id = ${schedule.facilityId}
      `.catch(() => [])

      const facLng = facilityLoc[0]?.lng || 121.04
      const facLat = facilityLoc[0]?.lat || 14.50
      console.log({ facLng, facLat })

      const storeIds = [...new Set(schedule.manifest.parcels.map(p => p.storeId).filter(Boolean))]

      let storeCoordsMap: Record<number, { lng: number; lat: number }> = {}
      if (storeIds.length > 0) {
        const storesRaw: any = await fastify.prisma.$queryRaw`
          SELECT id, ST_X(location::geometry) as lng, ST_Y(location::geometry) as lat 
          FROM stores WHERE id = ANY(${storeIds})
        `.catch(() => [])

        storesRaw.forEach((s: any) => {
          storeCoordsMap[s.id] = { lng: s.lng, lat: s.lat }
        })
      }
      console.log({ storeCoordsMap })

      const coordinatesList = [`${facLng},${facLat}`]
      const stopDetails: any[] = []

      schedule.manifest.parcels.forEach(p => {
        const storeCoord = storeCoordsMap[p.storeId]
        if (storeCoord && storeCoord.lng && storeCoord.lat) {
          coordinatesList.push(`${storeCoord.lng},${storeCoord.lat}`)
          stopDetails.push({
            parcelId: p.id,
            trackingNumber: p.trackingNumber,
            storeId: p.storeId,
            storeName: storeCoord.storeName,
            lng: storeCoord.lng,
            lat: storeCoord.lat
          })
        }
      })
      console.log({ coordinatesList })

      coordinatesList.push(`${facLng},${facLat}`)

      let osrmRouteData = null
      try {
        const coordsString = coordinatesList.join(';')
        console.log({ coordsString })

        // Use OSRM trip/v1 service for Traveling Salesperson Problem (TSP) optimized multi-stop routing
        // source=first ensures the route starts at the facility (index 0)
        // roundtrip=true ensures it returns to the starting facility
        const osrmRes: any = await fetch(
          `https://router.project-osrm.org/trip/v1/driving/${coordsString}?source=first&roundtrip=true&overview=full&geometries=geojson`
        ).then(res => res.json())

        if (osrmRes.trips && osrmRes.trips.length > 0) {
          osrmRouteData = osrmRes.trips[0]
        } else if (osrmRes.routes && osrmRes.routes.length > 0) {
          osrmRouteData = osrmRes.routes[0]
        }
        console.log({ osrmRouteData })
      } catch (err) {
        console.warn('OSRM Route calculation skipped/failed:', err)
      }

      await fastify.prisma.courierSchedule.update({
        where: { id: schedule.id },
        data: { route: osrmRouteData ? osrmRouteData.geometry : undefined }
      });

      await fastify.prisma.manifest.update({
        where: { id: schedule.manifest.id },
        data: {
          status: ManifestStatus.Accumulating,
        }
      });

      await fastify.prisma.manifestLog.create({
        data: {
          manifestId: schedule.manifest.id,
          status: ManifestStatus.Accumulating
        }
      });

      // I think I am not supposed to store every bit of gps updates
      await fastify.prisma.vehicleLocationLog.create({
        data: {
          physicalVehicleId: schedule.vehicleId,
          longitude: facLng,
          latitude: facLat,
          speed: 0,
          heading: 0
        }
      })

      return rep.code(200).send({
        message: 'Multi-stop departure confirmed and route calculated!',
        data: {
          status: 'Accumulating',
          route: osrmRouteData ? osrmRouteData.geometry : null,
          distanceMeters: osrmRouteData ? osrmRouteData.distance : 0,
          durationSeconds: osrmRouteData ? osrmRouteData.duration : 0,
          stops: stopDetails,
          facilityCoordinates: { lng: facLng, lat: facLat }
        }
      });
    }
  );

  fastify.post<{ Params: { courierScheduleId: string }; Body: { longitude: number; latitude: number; speed?: number; heading?: number } }>(
    vehicles.courierSchedules.telemetry.url,
    { preHandler: [userAuth] },
    async (req, rep) => {
      const { courierScheduleId } = req.params;
      const { longitude, latitude, speed = 35, heading = 0 } = req.body;

      const schedule = await fastify.prisma.courierSchedule.findUnique({
        where: { id: parseInt(courierScheduleId) },
        select: { vehicleId: true }
      });

      if (!schedule) {
        return rep.code(404).send({ message: 'Schedule not found,' });
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

      return rep.code(201).send({
        message: 'Telemetry recorded successfully.',
        data: {
          ...vehicleLog,
          id: Number(vehicleLog.id)
        }
      });
    }
  );
}

export async function dispatchLogRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: CreateDispatchLogBody }>(
    vehicles.dispatchLogs.store,
    { schema: CreateDispatchLogSchema },
    async (req, rep) => {
      const dispatchLog = await createDispatchLog(fastify, req.body)

      return rep.code(201).send({
        message: 'Dispatch log created successfully.',
        data: dispatchLog,
      })
    }
  )

  fastify.put<{ Body: UpdateDispatchLogBody; Params: UpdateDispatchLogParams }>(
    vehicles.dispatchLogs.update.url,
    { schema: UpdateDispatchLogSchema },
    async (req, rep) => {
      const { dispatchLogId } = req.params

      const updatedDispatchLog = await updateDispatchLog(fastify, dispatchLogId, req.body)

      return rep.code(200).send({
        message: 'Dispatch log updated successfully.',
        data: updatedDispatchLog,
      })
    }
  )

  fastify.delete<{ Params: DeleteDispatchLogParams }>(
    vehicles.dispatchLogs.delete.url,
    { schema: DeleteDispatchLogSchema },
    async (req, rep) => {
      const { dispatchLogId } = req.params

      await deleteDispatchLog(fastify, dispatchLogId)

      return rep.code(200).send({
        message: 'Dispatch log deleted successfully.',
      })
    }
  )
}