import { FastifyInstance } from "fastify";
import { CreatePhysicalVehicleBody, CreatePhysicalVehicleSchema, UpdatePhysicalVehicleBody, UpdatePhysicalVehicleParams, UpdatePhysicalVehicleSchema, DeletePhysicalVehicleParams, DeletePhysicalVehicleSchema, GetPhysicalVehicleParams, GetPhysicalVehicleSchema, PhysicalVehicleParams, PhysicalVehicleParamsSchema } from "../schemas/physical-vehicle.schema.js";
import { physicalVehicles } from "../paths/physical-vehicle.path.js";
import { userAuth } from "#commons/middlewares/user-auth.js";
import { availablePhysicalVehicleHandler, createPhysicalVehicleHandler, deletePhysicalVehicleHandler, indexPhysicalVehicleHandler, inTransitPhysicalVehicleHandler, maintenancePhysicalVehicleHandler, showPhysicalVehicleHandler, updatePhysicalVehicleHandler } from "../controllers/physical-vehicle.controller.js";

export async function physicalVehicleRoutes(fastify: FastifyInstance) {
  fastify.get(
    physicalVehicles.index,
    { preHandler: [userAuth] },
    indexPhysicalVehicleHandler
  )

  fastify.post<{ Body: CreatePhysicalVehicleBody }>(
    physicalVehicles.store,
    { schema: CreatePhysicalVehicleSchema, preHandler: [userAuth] },
    createPhysicalVehicleHandler
  )

  fastify.get<{ Params: GetPhysicalVehicleParams }>(
    physicalVehicles.show.url,
    { schema: GetPhysicalVehicleSchema, preHandler: [userAuth] },
    showPhysicalVehicleHandler
  )

  fastify.put<{ Body: UpdatePhysicalVehicleBody; Params: UpdatePhysicalVehicleParams }>(
    physicalVehicles.update.url,
    { schema: UpdatePhysicalVehicleSchema, preHandler: [userAuth] },
    updatePhysicalVehicleHandler
  )

  fastify.patch<{ Params: PhysicalVehicleParams }>(
    physicalVehicles.available.url,
    {
      preHandler: [userAuth],
      schema: PhysicalVehicleParamsSchema,
    },
    availablePhysicalVehicleHandler
  )

  fastify.patch<{ Params: PhysicalVehicleParams }>(
    physicalVehicles.inTransit.url,
    {
      preHandler: [userAuth],
      schema: PhysicalVehicleParamsSchema,
    },
    inTransitPhysicalVehicleHandler
  )

  fastify.patch<{ Params: PhysicalVehicleParams }>(
    physicalVehicles.maintenance.url,
    {
      preHandler: [userAuth],
      schema: PhysicalVehicleParamsSchema,
    },
    maintenancePhysicalVehicleHandler
  )

  fastify.delete<{ Params: DeletePhysicalVehicleParams }>(
    physicalVehicles.delete.url,
    { schema: DeletePhysicalVehicleSchema, preHandler: [userAuth] },
    deletePhysicalVehicleHandler
  )
}