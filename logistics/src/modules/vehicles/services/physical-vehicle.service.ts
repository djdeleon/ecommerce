import { FastifyInstance } from "fastify";
import { CreatePhysicalVehicleBody, UpdatePhysicalVehicleBody } from "../schemas/physical-vehicle.schema.js";
import { PhysicalVehicleStatus } from "@prisma/client";

export async function indexPhysicalVehicle(fastify: FastifyInstance) {
  const physicalVehicles = await fastify.prisma.physicalVehicle.findMany({
    include: { vehicleProfile: true }
  })

  return {
    physicalVehicles,
    vehicleStatuses: Object.values(PhysicalVehicleStatus)
  }
}

export async function createPhysicalVehicle(fastify: FastifyInstance, data: CreatePhysicalVehicleBody) {
  return await fastify.prisma.physicalVehicle.create({
    data,
    include: { vehicleProfile: true }
  })
}

export async function showPhysicalVehicle(fastify: FastifyInstance, id: number) {
  const physicalVehicle = await fastify.prisma.physicalVehicle.findUnique({
    where: { id },
    include: { vehicleProfile: true }
  })

  if (!physicalVehicle) {
    throw new Error('Physical vehicle not found')
  }

  return physicalVehicle
}

export async function updatePhysicalVehicle(fastify: FastifyInstance, id: number, data: UpdatePhysicalVehicleBody) {
  return await fastify.prisma.physicalVehicle.update({
    where: { id },
    data,
    include: { vehicleProfile: true }
  })
}

export async function availablePhysicalVehicle(fastify: FastifyInstance, id: number) {
  const physicalVehicle = await fastify.prisma.physicalVehicle.findUniqueOrThrow({
    where: { id }
  });

  return await fastify.prisma.$transaction(async (tx) => {
    const updatedPhysicalVehicle = await tx.physicalVehicle.update({
      where: { id: physicalVehicle.id },
      data: { status: PhysicalVehicleStatus.Available }
    })

    await tx.physicalVehicleLog.create({
      data: {
        physicalVehicleId: physicalVehicle.id,
        status: PhysicalVehicleStatus.Available
      }
    })

    return updatedPhysicalVehicle
  })
}

export async function inTransitPhysicalVehicle(fastify: FastifyInstance, id: number) {
  const physicalVehicle = await fastify.prisma.physicalVehicle.findUniqueOrThrow({
    where: { id }
  });

  return await fastify.prisma.$transaction(async (tx) => {
    const updatedPhysicalVehicle = await tx.physicalVehicle.update({
      where: { id: physicalVehicle.id },
      data: { status: PhysicalVehicleStatus.InTransit }
    })

    await tx.physicalVehicleLog.create({
      data: {
        physicalVehicleId: physicalVehicle.id,
        status: PhysicalVehicleStatus.InTransit
      }
    })

    return updatedPhysicalVehicle
  })
}

export async function maintenancePhysicalVehicle(fastify: FastifyInstance, id: number) {
  const physicalVehicle = await fastify.prisma.physicalVehicle.findUniqueOrThrow({
    where: { id }
  });

  if (physicalVehicle.status === PhysicalVehicleStatus.InTransit) {
    throw new Error(
      `Invalid State Transition: Physical Vehicle ID: '${physicalVehicle.id}' cannot transition from '${physicalVehicle.status}' to '${PhysicalVehicleStatus.Maintenance}. Set it to ${PhysicalVehicleStatus.Available} first.'.`
    )
  }

  return await fastify.prisma.$transaction(async (tx) => {
    const updatedPhysicalVehicle = await tx.physicalVehicle.update({
      where: { id: physicalVehicle.id },
      data: { status: PhysicalVehicleStatus.Maintenance }
    })

    await tx.physicalVehicleLog.create({
      data: {
        physicalVehicleId: physicalVehicle.id,
        status: PhysicalVehicleStatus.Maintenance
      }
    })

    return updatedPhysicalVehicle
  })
}

export async function deletePhysicalVehicle(fastify: FastifyInstance, id: number) {
  return await fastify.prisma.physicalVehicle.delete({
    where: { id }
  })
}