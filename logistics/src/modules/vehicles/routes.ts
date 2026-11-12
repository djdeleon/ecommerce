import { FastifyInstance } from "fastify";
import { CreateVehicleProfile, CreateVehicleSchema, DeleteVehicleParams, DeleteVehicleSchema, UpdateVehicleBody, UpdateVehicleParams, UpdateVehicleSchema } from "./schemas/vehicle-profile.schema.js";
import { CreatePhysicalVehicleBody, CreatePhysicalVehicleSchema, DeletePhysicalVehicleParams, DeletePhysicalVehicleSchema, UpdatePhysicalVehicleBody, UpdatePhysicalVehicleParams, UpdatePhysicalVehicleSchema } from "./schemas/physical-vehicle.schema.js";
import { CreateCourierScheduleBody, CreateCourierScheduleSchema, DeleteCourierScheduleParams, DeleteCourierScheduleSchema, UpdateCourierScheduleBody, UpdateCourierScheduleParams, UpdateCourierScheduleSchema } from "./schemas/courier-schedule.schema.js";
import { createVehicleProfile, deleteVehicleProfile, updateVehicleProfile } from "./services/vehicle-profile.service.js";
import { createPhysicalVehicle, deletePhysicalVehicle, updatePhysicalVehicle } from "./services/physical-vehicle.service.js";
import { CreateDispatchLogBody, CreateDispatchLogSchema, UpdateDispatchLogBody, UpdateDispatchLogParams, UpdateDispatchLogSchema, DeleteDispatchLogParams, DeleteDispatchLogSchema } from "./schemas/dispatch-log.schema.js";
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