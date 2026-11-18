import { FastifyInstance } from "fastify";
import { CreateVehicleProfile, CreateVehicleSchema, UpdateVehicleBody, UpdateVehicleParams, UpdateVehicleSchema, DeleteVehicleParams, DeleteVehicleSchema, GetVehicleParams, GetVehicleSchema } from "../schemas/vehicle-profile.schema.js";
import { createVehicleProfile, updateVehicleProfile, deleteVehicleProfile, getVehicleProfileById, getVehicleProfiles } from "../services/vehicle-profile.service.js";
import { vehicleProfiles } from "../paths/vehicle-profile.path.js";

export async function vehicleProfileRoutes(fastify: FastifyInstance) {
  fastify.get(vehicleProfiles.index, async (_req, rep) => {
    const profiles = await getVehicleProfiles(fastify)

    return rep.code(200).send({
      message: 'Vehicle profiles retrieved successfully',
      data: profiles,
    })
  })

  fastify.post<{ Body: CreateVehicleProfile }>(vehicleProfiles.store, { schema: CreateVehicleSchema }, async (req, rep) => {
    const vehicleProfile = await createVehicleProfile(fastify, req.body)

    return rep.code(201).send({
      message: 'Vehicle profile created successfully',
      data: vehicleProfile,
    })
  })

  fastify.get<{ Params: GetVehicleParams }>(
    vehicleProfiles.show.url,
    { schema: GetVehicleSchema },
    async (req, rep) => {
      const { id } = req.params
      const profile = await getVehicleProfileById(fastify, id)

      return rep.code(200).send({
        message: 'Vehicle profile retrieved successfully',
        data: profile,
      })
    }
  )

  fastify.put<{ Body: UpdateVehicleBody; Params: UpdateVehicleParams }>(
    vehicleProfiles.update.url,
    { schema: UpdateVehicleSchema },
    async (req, rep) => {
      const { id } = req.params

      const updatedProfile = await updateVehicleProfile(fastify, id, req.body)

      return rep.code(200).send({
        message: 'Vehicle profile updated successfully',
        data: updatedProfile,
      })
    }
  )

  fastify.delete<{ Params: DeleteVehicleParams }>(
    vehicleProfiles.delete.url,
    { schema: DeleteVehicleSchema },
    async (req, rep) => {
      const { id } = req.params

      await deleteVehicleProfile(fastify, id)

      return rep.code(200).send({
        message: 'Vehicle profile deleted successfully',
      })
    }
  )
}