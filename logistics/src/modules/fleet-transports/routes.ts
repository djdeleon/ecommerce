import { FastifyInstance } from "fastify";
import { create, destroy, update } from "./service.js";
import { CreateBody, CreateSchema, DeleteParams, DeleteSchema, UpdateBody, UpdateParams, UpdateSchema } from "./schema.js";
import { paths } from "./paths.js";
import { userAuth } from "#commons/middlewares/user-auth.js";
import { ManifestStatus, MasterBagStatus } from "@prisma/client";

export default async function routes(fastify: FastifyInstance) {
  fastify.get(paths.index, {
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

    const fleetTransports = await fastify.prisma.fleetTransport.findMany({
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
        delivery: {
          include: {
            parcels: true
          }
        },
        masterBags: true,
      },
      orderBy: { scheduledTime: 'asc' }
    })

    const allStoreIds = [...new Set(fleetTransports.flatMap(s => s.manifest?.parcels.map(p => p.storeId).filter(Boolean) || []))]
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

    const allDeliveryParcelIds = [...new Set(fleetTransports.flatMap(s => s.delivery?.parcels.map(p => p.id) || []))]
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

    const formattedSchedules = fleetTransports.map(s => {
      const isDelivery = s.scheduledFor === 'Delivery';
      const targetParcels = isDelivery ? (s.delivery?.parcels || []) : (s.manifest?.parcels || []);

      return {
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
        deliveryCode: s.delivery?.code,
        deliveryStatus: s.delivery?.status,
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
        masterBags: s.masterBags || [],
        route: s.route || null
      }
    })

    return rep.status(200).send({
      message: 'Courier Schedules retrieved.',
      data: formattedSchedules
    })
  })

  fastify.post<{ Body: CreateBody }>(
    paths.store,
    {
      schema: CreateSchema,
      preHandler: [userAuth]
    },
    async (req, rep) => {
      const manager = (req as any).user
      const payload = {
        ...req.body,
        facilityId: manager.assignedFacilityId,
      }

      const fleetTransport = await create(fastify, payload)

      return rep.code(201).send({
        message: 'Courier schedule created successfully.',
        data: fleetTransport,
      })
    }
  )

  fastify.put<{ Body: UpdateBody; Params: UpdateParams }>(
    paths.update.url,
    {
      schema: UpdateSchema,
      preHandler: [userAuth]
    },
    async (req, rep) => {
      const { id } = req.params

      const updatedFleetTransport = await update(fastify, id, req.body)

      return rep.code(200).send({
        message: 'Courier schedule updated successfully.',
        data: updatedFleetTransport,
      })
    }
  )

  fastify.delete<{ Params: DeleteParams }>(
    paths.delete.url,
    { schema: DeleteSchema },
    async (req, rep) => {
      const { id } = req.params

      await destroy(fastify, id)

      return rep.code(200).send({
        message: 'Courier schedule deleted successfully.',
      })
    }
  )

  fastify.post<{ Params: { id: string } }>(paths.depart.url,
    { preHandler: [userAuth] },
    async (req, rep) => {
      const { id } = req.params;

      const schedule = await fastify.prisma.fleetTransport.findUnique({
        where: { id: parseInt(id) },
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

        await fastify.prisma.fleetTransport.update({
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

      if (!schedule.manifest && !schedule.delivery) {
        return rep.code(404).send({ message: 'Schedule must be associated with a Manifest or Delivery' })
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

      return rep.code(200).send({
        message: `${isDelivery ? 'Delivery' : 'Manifest'} multi-stop departure confirmed and route calculated!`,
        data: {
          status: isDelivery ? 'Loading' : 'Accumulating',
          route: osrmRouteData ? osrmRouteData.geometry : null,
          distanceMeters: osrmRouteData ? osrmRouteData.distance : 0,
          durationSeconds: osrmRouteData ? osrmRouteData.duration : 0,
          stops: stopDetails,
          facilityCoordinates: { lng: facLng, lat: facLat }
        }
      });
    }
  );

  fastify.post<{ Params: { id: string }; Body: { longitude: number; latitude: number; speed?: number; heading?: number } }>(
    paths.telemetry.url,
    { preHandler: [userAuth] },
    async (req, rep) => {
      const { id } = req.params;
      const { longitude, latitude, speed = 35, heading = 0 } = req.body;

      const schedule = await fastify.prisma.fleetTransport.findUnique({
        where: { id: parseInt(id) },
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

  fastify.patch(paths.dispatch.url, { preHandler: [userAuth] }, async (req, rep) => {
    const { id } = req.params as { id: string };

    const run = await fastify.prisma.fleetTransport.update({
      where: { id: parseInt(id) },
      data: {
        dispatchedAt: new Date(),
        // update related statuses here
      },
      include: { vehicle: true, courier: true }
    });

    // Cascade: Update physical vehicle status
    await fastify.prisma.physicalVehicle.update({
      where: { id: run.vehicleId },
      data: { status: 'Transit' }
    });

    return rep.send({ message: 'Transport run dispatched', data: run });
  });

  fastify.patch(paths.arrive.url, { preHandler: [userAuth] }, async (req, rep) => {
    const { id } = req.params as { id: string };

    // Basic Validation: Can't arrive if not dispatched
    const check = await fastify.prisma.fleetTransport.findUnique({ where: { id: parseInt(id) } });
    if (!check?.dispatchedAt) {
      return rep.code(400).send({ message: "Cannot arrive a run that hasn't been dispatched." });
    }

    const run = await fastify.prisma.fleetTransport.update({
      where: { id: parseInt(id) },
      data: { arrivedAt: new Date() },
      include: { vehicle: true, courier: true }
    });

    // Cascade: Free up the vehicle and courier
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

    return rep.send({ message: 'Transport run arrived back at facility', data: run });
  });
}