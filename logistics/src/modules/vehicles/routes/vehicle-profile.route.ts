import { FastifyInstance } from "fastify";
import { CreateVehicleProfileBody, CreateVehicleSchema, UpdateVehicleBody, UpdateVehicleParams, UpdateVehicleSchema, DeleteVehicleParams, DeleteVehicleSchema, GetVehicleParams, GetVehicleSchema } from "../schemas/vehicle-profile.schema.js";
import { vehicleProfiles } from "../paths/vehicle-profile.path.js";
import { createVehicleProfileHandler, deleteVehicleProfileHandler, indexVehicleProfileHandler, showVehicleProfileHandler, updateVehicleProfileHandler } from "../controllers/vehicle-profile.controller.js";
import { userAuth } from "#commons/middlewares/user-auth.js";

export async function vehicleProfileRoutes(fastify: FastifyInstance) {
  fastify.get(
    vehicleProfiles.index,
    { preHandler: [userAuth] },
    indexVehicleProfileHandler
  )

  fastify.post<{ Body: CreateVehicleProfileBody }>(
    vehicleProfiles.store,
    {
      preHandler: [userAuth],
      schema: CreateVehicleSchema
    },
    createVehicleProfileHandler
  )

  fastify.get<{ Params: GetVehicleParams }>(
    vehicleProfiles.show.url,
    {
      preHandler: [userAuth],
      schema: GetVehicleSchema
    },
    showVehicleProfileHandler
  )

  fastify.put<{ Body: UpdateVehicleBody; Params: UpdateVehicleParams }>(
    vehicleProfiles.update.url,
    { schema: UpdateVehicleSchema },
    updateVehicleProfileHandler
  )

  fastify.delete<{ Params: DeleteVehicleParams }>(
    vehicleProfiles.delete.url,
    { schema: DeleteVehicleSchema },
    deleteVehicleProfileHandler
  )
}