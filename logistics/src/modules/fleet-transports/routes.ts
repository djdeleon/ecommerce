import { FastifyInstance } from "fastify";
import { CreateFleetTransportBody, CreateFleetTransportSchema, DeleteFleetTransportSchema, FleetTransportParams, TelemetryFleetTransportBody, TelemetryFleetTransportParams, TelemetryFleetTransportSchema, UpdateFleetTransportBody, UpdateFleetTransportSchema } from "./schema.js";
import { fleetTransports } from "./paths.js";
import { userAuth } from "#commons/middlewares/user-auth.js";
import { arriveFleetTransportHandler, courierTasksFleetTransportHandler, createFleetTransportHandler, deleteFleetTransportHandler, dispatchFleetTransportHandler, indexFleetTransportHandler, returnFleetTransportHandler, schedulesFleetTransportHandler, showFleetTransportHandler, storeFleetTransportHandler, recordTelemetryFleetTransportHandler, updateFleetTransportHandler, departFleetTransportHandler } from "./controller.js";

export default async function routes(fastify: FastifyInstance) {
  fastify.get(
    fleetTransports.index,
    { preHandler: [userAuth] },
    indexFleetTransportHandler
  )

  fastify.get<{ Querystring: { facilityId?: string } }>(
    fleetTransports.create,
    { preHandler: [userAuth] },
    createFleetTransportHandler
  )

  fastify.get(
    fleetTransports.tasks,
    { preHandler: [userAuth] },
    courierTasksFleetTransportHandler
  )

  fastify.get(
    fleetTransports.schedules,
    { preHandler: [userAuth] },
    schedulesFleetTransportHandler
  )

  fastify.post<{ Body: CreateFleetTransportBody }>(
    fleetTransports.store,
    {
      schema: CreateFleetTransportSchema,
      preHandler: [userAuth]
    }, storeFleetTransportHandler
  )

  fastify.get<{ Params: FleetTransportParams }>(
    fleetTransports.show.url,
    { preHandler: [userAuth] },
    showFleetTransportHandler
  )

  fastify.put<{ Body: UpdateFleetTransportBody; Params: FleetTransportParams }>(
    fleetTransports.update.url,
    {
      schema: UpdateFleetTransportSchema,
      preHandler: [userAuth]
    },
    updateFleetTransportHandler
  )

  fastify.delete<{ Params: FleetTransportParams }>(
    fleetTransports.delete.url,
    {
      schema: DeleteFleetTransportSchema,
      preHandler: [userAuth]
    }, deleteFleetTransportHandler
  )

  fastify.patch<{ Params: FleetTransportParams }>(
    fleetTransports.depart.url,
    { preHandler: [userAuth] },
    departFleetTransportHandler
  )

  fastify.patch<{ Params: FleetTransportParams }>(
    fleetTransports.dispatch.url,
    { preHandler: [userAuth] },
    dispatchFleetTransportHandler
  )

  fastify.patch<{ Params: FleetTransportParams }>(
    fleetTransports.arrive.url,
    { preHandler: [userAuth] },
    arriveFleetTransportHandler
  )

  fastify.patch<{ Params: FleetTransportParams }>(
    fleetTransports.return.url,
    { preHandler: [userAuth] },
    returnFleetTransportHandler
  )

  fastify.post<{ Params: TelemetryFleetTransportParams; Body: TelemetryFleetTransportBody }>(
    fleetTransports.telemetry.url,
    {
      schema: TelemetryFleetTransportSchema,
      preHandler: [userAuth]
    },
    recordTelemetryFleetTransportHandler
  )
}