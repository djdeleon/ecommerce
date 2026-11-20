import { FastifyInstance } from "fastify";
import { arriveFleetTransport, createFleetTransport, deleteFleetTransport, dispatchFleetTransport, getCourierTasks, getCreateData, getFacilitySchedules, getFleetTransportById, getFleetTransports, recordTelemetry, updateFleetTransport } from "./service.js";
import { CreateBody, CreateSchema, DeleteParams, DeleteSchema, UpdateBody, UpdateParams, UpdateSchema } from "./schema.js";
import { fleetTransports } from "./paths.js";
import { userAuth } from "#commons/middlewares/user-auth.js";
import { ManifestStatus, MasterBagStatus } from "@prisma/client";

export default async function routes(fastify: FastifyInstance) {
  fastify.get(fleetTransports.index, {
    preHandler: [userAuth]
  }, async (req, rep) => {
    const data = await getFleetTransports(fastify)

    return rep.status(200).send({ message: 'Fleet Transports retrieved successfully.', data })
  })

  fastify.get<{ Querystring: { facilityId?: string } }>(fleetTransports.create, { preHandler: [userAuth] }, async (req, rep) => {
    const user = (req as any).user;
    const queryFacilityId = req.query.facilityId ? parseInt(req.query.facilityId, 10) : undefined;

    const targetFacilityId = queryFacilityId || user.assignedFacilityId;

    const data = await getCreateData(fastify, targetFacilityId);

    return rep.send({ message: 'Options for new fleet transport retrieved.', data });
  });

  fastify.get(fleetTransports.tasks, { preHandler: [userAuth] }, async (req, rep) => {
    const user = (req as any).user;
    if (!user.courier?.id) return rep.code(403).send({ message: "Courier profile not found." });

    const data = await getCourierTasks(fastify, user.courier.id);
    return rep.status(200).send({ message: 'Courier Fleet Tranport Tasks retrieved.', data });
  });

  fastify.get(fleetTransports.schedules, { preHandler: [userAuth] }, async (req, rep) => {
    const user = (req as any).user;
    if (!user.assignedFacilityId) return rep.code(403).send({ message: "Facility assignment required." });

    const data = await getFacilitySchedules(fastify, user.assignedFacilityId);
    return rep.status(200).send({ message: 'Facility Fleet Transport Schedules retrieved.', data });
  });

  fastify.post<{ Body: CreateBody }>(fleetTransports.store, {
    schema: CreateSchema,
    preHandler: [userAuth]
  },
    async (req, rep) => {
      const manager = (req as any).user
      const payload = {
        ...req.body,
        facilityId: manager.assignedFacilityId,
      }

      const fleetTransport = await createFleetTransport(fastify, payload)

      return rep.code(201).send({
        message: 'Fleet Transport created successfully.',
        data: fleetTransport,
      })
    }
  )

  fastify.get<{ Params: { id: string } }>(fleetTransports.show.url, {
    preHandler: [userAuth]
  }, async (req, rep) => {
    const { id } = req.params;
    const data = await getFleetTransportById(fastify, id);

    return rep.status(200).send({
      message: 'Fleet Transport retrieved successfully.',
      data
    });
  });

  fastify.put<{ Body: UpdateBody; Params: UpdateParams }>(fleetTransports.update.url, {
    schema: UpdateSchema,
    preHandler: [userAuth]
  },
    async (req, rep) => {
      const { id } = req.params
      const data = await updateFleetTransport(fastify, id, req.body)

      return rep.code(200).send({
        message: 'Fleet Transport updated successfully.',
        data,
      })
    }
  )

  fastify.delete<{ Params: DeleteParams }>(fleetTransports.delete.url, {
    schema: DeleteSchema,
    preHandler: [userAuth]
  },
    async (req, rep) => {
      const { id } = req.params
      await deleteFleetTransport(fastify, id)

      return rep.code(200).send({
        message: 'Fleet Transport deleted successfully.',
      })
    }
  )

  fastify.post<{ Params: { id: string } }>(fleetTransports.depart.url, {
    preHandler: [userAuth]
  },
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

  fastify.post<{ Params: { id: string }; Body: { longitude: number; latitude: number; speed?: number; heading?: number } }>(fleetTransports.telemetry.url, {
    preHandler: [userAuth]
  },
    async (req, rep) => {
      const { id } = req.params;
      const vehicleLog = await recordTelemetry(fastify, id, req.body);

      return rep.code(201).send({
        message: 'Telemetry recorded successfully.',
        data: vehicleLog
      });
    }
  );

  fastify.patch(fleetTransports.dispatch.url, { preHandler: [userAuth] }, async (req, rep) => {
    const { id } = req.params as { id: string };
    const data = await dispatchFleetTransport(fastify, id);

    return rep.status(200).send({
      message: 'Transport run dispatched',
      data
    });
  });

  fastify.patch(fleetTransports.arrive.url, { preHandler: [userAuth] }, async (req, rep) => {
    const { id } = req.params as { id: string };
    const data = await arriveFleetTransport(fastify, id);

    return rep.send({
      message: 'Transport run arrived back at facility',
      data
    });
  });
}