import { FastifyRequest, FastifyReply } from "fastify"
import { availablePhysicalVehicle, createPhysicalVehicle, deletePhysicalVehicle, indexPhysicalVehicle, inTransitPhysicalVehicle, maintenancePhysicalVehicle, showPhysicalVehicle, updatePhysicalVehicle } from "../services/physical-vehicle.service.js"
import { CreatePhysicalVehicleBody, DeletePhysicalVehicleParams, GetPhysicalVehicleParams, PhysicalVehicleParams, UpdatePhysicalVehicleBody, UpdatePhysicalVehicleParams } from "../schemas/physical-vehicle.schema.js"
import parseId from "#commons/utils/id-parser.js"

export async function indexPhysicalVehicleHandler(request: FastifyRequest, reply: FastifyReply) {
  return reply.code(200).send({
    message: 'Physical Vehicles retrieved successfully.',
    data: await indexPhysicalVehicle(request.server)
  })
}

export async function createPhysicalVehicleHandler(request: FastifyRequest<{ Body: CreatePhysicalVehicleBody }>, reply: FastifyReply) {
  const payload = {
    ...request.body,
    assignedFacilityId: request.user.assignedFacilityId,
  }

  return reply.code(201).send({
    message: 'Physical Vehicle created successfully.',
    data: await createPhysicalVehicle(request.server, payload)
  })
}

export async function showPhysicalVehicleHandler(request: FastifyRequest<{ Params: GetPhysicalVehicleParams }>, reply: FastifyReply) {
  return reply.code(200).send({
    message: 'Physical Vehicle retrieved successfully.',
    data: await showPhysicalVehicle(request.server, parseId(request.params.id))
  })
}

export async function updatePhysicalVehicleHandler(request: FastifyRequest<{ Body: UpdatePhysicalVehicleBody; Params: UpdatePhysicalVehicleParams }>, reply: FastifyReply) {
  return reply.code(200).send({
    message: 'Physical Vehicle updated successfully.',
    data: await updatePhysicalVehicle(request.server, parseId(request.params.id), request.body)
  })
}

export async function availablePhysicalVehicleHandler(request: FastifyRequest<{ Params: PhysicalVehicleParams }>, reply: FastifyReply) {
  return reply.send({
    message: 'Physical Vehicle marked as available successfully.',
    data: await availablePhysicalVehicle(request.server, parseId(request.params.id))
  })
}

export async function inTransitPhysicalVehicleHandler(request: FastifyRequest<{ Params: PhysicalVehicleParams }>, reply: FastifyReply) {
  return reply.send({
    message: 'Physical Vehicle marked as In Transit successfully.',
    data: await inTransitPhysicalVehicle(request.server, parseId(request.params.id))
  })
}

export async function maintenancePhysicalVehicleHandler(request: FastifyRequest<{ Params: PhysicalVehicleParams }>, reply: FastifyReply) {
  return reply.send({
    message: 'Physical Vehicle marked as Maintenance successfully.',
    data: await maintenancePhysicalVehicle(request.server, parseId(request.params.id))
  })
}

export async function deletePhysicalVehicleHandler(request: FastifyRequest<{ Params: DeletePhysicalVehicleParams }>, reply: FastifyReply) {
  await deletePhysicalVehicle(request.server, parseId(request.params.id))

  return reply.code(200).send({
    message: 'Physical Vehicle deleted successfully.',
  })
}