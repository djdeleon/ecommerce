import { FastifyInstance } from "fastify";
import { CreatePhysicalVehicleBody, CreatePhysicalVehicleSchema, UpdatePhysicalVehicleBody, UpdatePhysicalVehicleParams, UpdatePhysicalVehicleSchema, DeletePhysicalVehicleParams, DeletePhysicalVehicleSchema, GetPhysicalVehicleParams, GetPhysicalVehicleSchema } from "../schemas/physical-vehicle.schema.js";
import { createPhysicalVehicle, updatePhysicalVehicle, deletePhysicalVehicle, getPhysicalVehicleById, getPhysicalVehicles } from "../services/physical-vehicle.service.js";
import { physicalVehicles } from "../paths/physical-vehicle.path.js";
import { userAuth } from "#commons/middlewares/user-auth.js";
import { VehicleStatus } from "@prisma/client";

export async function physicalVehicleRoutes(fastify: FastifyInstance) {
  fastify.get(physicalVehicles.index, { preHandler: [userAuth] }, async (_req, rep) => {
    const physicalVehiclesList = await getPhysicalVehicles(fastify)

    return rep.code(200).send({
      message: 'Physical vehicles retrieved successfully.',
      data: physicalVehiclesList,
    })
  })

  fastify.post<{ Body: CreatePhysicalVehicleBody }>(
    physicalVehicles.store,
    { schema: CreatePhysicalVehicleSchema, preHandler: [userAuth] },
    async (req, rep) => {
      const user = (req as any).user
      const payload = {
        ...req.body,
        assignedFacilityId: user.assignedFacilityId,
      }
      console.log({ user, payload })
      const physicalVehicle = await createPhysicalVehicle(fastify, payload)

      return rep.code(201).send({
        message: 'Physical vehicle created successfully.',
        data: physicalVehicle,
      })
    }
  )

  fastify.get<{ Params: GetPhysicalVehicleParams }>(
    physicalVehicles.show.url,
    { schema: GetPhysicalVehicleSchema, preHandler: [userAuth] },
    async (req, rep) => {
      const { id } = req.params
      const physicalVehicle = await getPhysicalVehicleById(fastify, id)

      return rep.code(200).send({
        message: 'Physical vehicle retrieved successfully.',
        data: physicalVehicle,
      })
    }
  )

  fastify.put<{ Body: UpdatePhysicalVehicleBody; Params: UpdatePhysicalVehicleParams }>(
    physicalVehicles.update.url,
    { schema: UpdatePhysicalVehicleSchema, preHandler: [userAuth] },
    async (req, rep) => {
      const { id } = req.params

      const updatedVehicle = await updatePhysicalVehicle(fastify, id, req.body)

      return rep.code(200).send({
        message: 'Physical vehicle updated successfully.',
        data: updatedVehicle,
      })
    }
  )

  fastify.delete<{ Params: DeletePhysicalVehicleParams }>(
    physicalVehicles.delete.url,
    { schema: DeletePhysicalVehicleSchema, preHandler: [userAuth] },
    async (req, rep) => {
      const { id } = req.params

      await deletePhysicalVehicle(fastify, id)

      return rep.code(200).send({
        message: 'Physical vehicle deleted successfully.',
      })
    }
  )

  fastify.get(physicalVehicles.statuses, async (req, rep) => {
    const roles = Object.values(VehicleStatus)

    return rep.send({ message: 'Physical Vehicle Statuses retrieved successfully.', data: roles })
  })
}