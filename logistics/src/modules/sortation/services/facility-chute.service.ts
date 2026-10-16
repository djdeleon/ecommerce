import { FastifyInstance } from "fastify";
import { CreateFacilityChuteBody, UpdateFacilityChuteBody } from "../schemas/facility-chute.schema.js";
import parseId from "#commons/utils/id-parser.js";

export async function createFacilityChute(
  fastify: FastifyInstance, 
  data: CreateFacilityChuteBody
) {
  const { code, facilityId, destinationFacilityId, isActive } = data

  return await fastify.prisma.facilityChute.create({
    data: {
      code,
      facilityId,
      destinationFacilityId,
      ...(isActive !== undefined && { isActive }),
    },
  })
}

export async function updateFacilityChute(
  fastify: FastifyInstance,
  idParam: string,
  data: UpdateFacilityChuteBody
) {
  const id = parseId(idParam)
  const { code, facilityId, destinationFacilityId, isActive } = data

  return await fastify.prisma.facilityChute.update({
    where: { id },
    data: {
      ...(code && { code }),
      ...(facilityId && { facilityId }),
      ...(destinationFacilityId && { destinationFacilityId }),
      ...(isActive !== undefined && { isActive }),
    },
  })
}

export async function deleteFacilityChute(
  fastify: FastifyInstance,
  idParam: string
) {
  const id = parseId(idParam)

  return await fastify.prisma.facilityChute.delete({
    where: { id },
  })
}