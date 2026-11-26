import { FastifyInstance } from "fastify";
import { CreateVehicleProfileBody, UpdateVehicleBody } from "../schemas/vehicle-profile.schema.js";

export async function indexVehicleProfile(fastify: FastifyInstance) {
  return await fastify.prisma.vehicleProfile.findMany({
    orderBy: { createdAt: 'desc' },
  })
}

export async function showVehicleProfile(fastify: FastifyInstance, id: number) {
  return await fastify.prisma.vehicleProfile.findUniqueOrThrow({
    where: { id }
  })
}

export async function createVehicleProfile(fastify: FastifyInstance, data: CreateVehicleProfileBody) {
  return await fastify.prisma.vehicleProfile.create({ data })
}

export async function updateVehicleProfile(fastify: FastifyInstance, id: number, data: UpdateVehicleBody) {
  return await fastify.prisma.vehicleProfile.update({
    where: { id },
    data
  })
}

export async function deleteVehicleProfile(fastify: FastifyInstance, id: number) {
  return await fastify.prisma.vehicleProfile.delete({ where: { id } })
}