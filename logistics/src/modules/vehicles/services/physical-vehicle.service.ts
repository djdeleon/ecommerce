import { FastifyInstance } from "fastify";
import { CreatePhysicalVehicleBody, UpdatePhysicalVehicleBody } from "../schemas/physical-vehicle.schema.js";
import parseId from "#commons/utils/id-parser.js";

export async function getPhysicalVehicles(fastify: FastifyInstance) {
  return await fastify.prisma.physicalVehicle.findMany({
    include: { vehicleProfile: true }
  })
}

export async function createPhysicalVehicle(
  fastify: FastifyInstance,
  data: CreatePhysicalVehicleBody
) {
  return await fastify.prisma.physicalVehicle.create({
    data: {
      vehicleProfileId: data.vehicleProfileId,
      assignedFacilityId: data.assignedFacilityId,
      plateNumber: data.plateNumber,
      status: data.status,
    },
    include: { vehicleProfile: true }
  })
}

export async function getPhysicalVehicleById(fastify: FastifyInstance, idParam: string) {
  const id = parseId(idParam)

  const physicalVehicle = await fastify.prisma.physicalVehicle.findUnique({
    where: { id },
    include: { vehicleProfile: true }
  })

  if (!physicalVehicle) {
    throw new Error('Physical vehicle not found')
  }

  return physicalVehicle
}

export async function updatePhysicalVehicle(
  fastify: FastifyInstance,
  idParam: string,
  data: UpdatePhysicalVehicleBody
) {
  const id = parseId(idParam)

  return await fastify.prisma.physicalVehicle.update({
    where: { id },
    data,
    include: { vehicleProfile: true }
  })
}

export async function deletePhysicalVehicle(
  fastify: FastifyInstance,
  idParam: string
) {
  const id = parseId(idParam)

  return await fastify.prisma.physicalVehicle.delete({
    where: { id },
  })
}