import { FastifyRequest, FastifyReply } from "fastify"
import { createVehicleProfile, deleteVehicleProfile, showVehicleProfile, indexVehicleProfile, updateVehicleProfile } from "../services/vehicle-profile.service.js"
import { CreateVehicleProfileBody, DeleteVehicleParams, GetVehicleParams, UpdateVehicleBody, UpdateVehicleParams } from "../schemas/vehicle-profile.schema.js"
import parseId from "#commons/utils/id-parser.js"

export async function indexVehicleProfileHandler(request: FastifyRequest, reply: FastifyReply) {
  return reply.code(200).send({
    message: 'Vehicle Profiles retrieved successfully.',
    data: await indexVehicleProfile(request.server)
  })
}

export async function createVehicleProfileHandler(request: FastifyRequest<{ Body: CreateVehicleProfileBody }>, reply: FastifyReply) {
  return reply.code(201).send({
    message: 'Vehicle Profile created successfully.',
    data: await createVehicleProfile(request.server, request.body)
  })
}

export async function showVehicleProfileHandler(request: FastifyRequest<{ Params: GetVehicleParams }>, reply: FastifyReply) {
  return reply.code(200).send({
    message: 'Vehicle Profile retrieved successfully.',
    data: await showVehicleProfile(request.server, parseId(request.params.id))
  })
}


export async function updateVehicleProfileHandler(request: FastifyRequest<{ Body: UpdateVehicleBody; Params: UpdateVehicleParams }>, reply: FastifyReply) {
  return reply.code(200).send({
    message: 'Vehicle Profile updated successfully.',
    data: await updateVehicleProfile(request.server, parseId(request.params.id), request.body)
  })
}

export async function deleteVehicleProfileHandler(request: FastifyRequest<{ Params: DeleteVehicleParams }>, reply: FastifyReply) {
  return reply.code(200).send({
    message: 'Vehicle Profile deleted successfully.',
    data: await deleteVehicleProfile(request.server, parseId(request.params.id))
  })
}