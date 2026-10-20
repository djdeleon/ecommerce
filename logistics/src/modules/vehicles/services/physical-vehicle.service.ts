import { FastifyInstance } from "fastify";
import { CreatePhysicalVehicleBody, UpdatePhysicalVehicleBody } from "../schemas/physical-vehicle.schema.js";
import parseId from "#commons/utils/id-parser.js";

export async function createPhysicalVehicle(
  fastify: FastifyInstance,
  data: CreatePhysicalVehicleBody
) {
  const [physicalVehicle] = await fastify.prisma.$queryRaw<any[]>`
    INSERT INTO physical_vehicles (vehicle_profile_id, assigned_facility_id, plate_number, created_at, updated_at)
    VALUES (
      ${data.vehicleProfileId}, 
      ${data.assignedFacilityId}, 
      ${data.plateNumber}, 
      NOW(),
      NOW()
    )
    RETURNING 
      id, 
      vehicle_profile_id AS "vehicleProfileId", 
      assigned_facility_id AS "assignedFacilityId", 
      plate_number AS "plateNumber", 
      created_at AS "createdAt", 
      updated_at AS "updatedAt"
  `

  return physicalVehicle
}

export async function updatePhysicalVehicle(
  fastify: FastifyInstance,
  idParam: string,
  data: UpdatePhysicalVehicleBody
) {
  const id = parseId(idParam)

  await fastify.prisma.physicalVehicle.update({
    where: { id },
    data
  })

  const [updatedVehicle] = await fastify.prisma.$queryRaw<any[]>`
    SELECT 
      id, 
      vehicle_profile_id AS "vehicleProfileId", 
      assigned_facility_id AS "assignedFacilityId", 
      plate_number AS "plateNumber", 
      created_at AS "createdAt", 
      updated_at AS "updatedAt"
    FROM physical_vehicles
    WHERE id = ${id}
  `

  return updatedVehicle
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