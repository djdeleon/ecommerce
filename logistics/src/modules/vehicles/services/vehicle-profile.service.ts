import { VehicleType } from "@prisma/client";
import { FastifyInstance } from "fastify";
import { CreateVehicleProfile, UpdateVehicleBody } from "../schemas/vehicle-profile.schema.js";
import parseId from "#commons/utils/id-parser.js";

export async function createVehicleProfile(fastify: FastifyInstance, data: CreateVehicleProfile) {
  return await fastify.prisma.vehicleProfile.create({
    data: {
      ...data,
      type: data.type as unknown as VehicleType,
    },
  })
}

export async function updateVehicleProfile(
  fastify: FastifyInstance,
  idParam: string,
  data: UpdateVehicleBody
) {
  const id = parseId(idParam)

  return await fastify.prisma.vehicleProfile.update({
    where: { id },
    data: {
      ...data,
      ...(data.type && { type: data.type as unknown as VehicleType }),
    },
  })
}

export async function deleteVehicleProfile(
  fastify: FastifyInstance,
  idParam: string
) {
  const id = parseId(idParam)

  return await fastify.prisma.vehicleProfile.delete({
    where: { id },
  })
}