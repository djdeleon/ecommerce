import { FastifyInstance } from "fastify";
import { CreatePhysicalVehicleBody, UpdatePhysicalVehicleBody } from "../schemas/physical-vehicle.schema.js";
import parseId from "#commons/utils/id-parser.js";

export async function createPhysicalVehicle(
  fastify: FastifyInstance, 
  data: CreatePhysicalVehicleBody
) {
  const { gps, ...rest } = data

  const [physicalVehicle] = await fastify.prisma.$queryRaw<any[]>`
    INSERT INTO physical_vehicles (vehicle_profile_id, assigned_facility_id, plate_number, gps, created_at, updated_at)
    VALUES (
      ${rest.vehicleProfileId}, 
      ${rest.assignedFacilityId}, 
      ${rest.plateNumber}, 
      ST_SetSRID(ST_MakePoint(${gps.longitude}, ${gps.latitude}), 4326),
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
  const { gps, ...rest } = data

  if (gps) {
    await fastify.prisma.$executeRaw`
      UPDATE physical_vehicles
      SET 
        plate_number = COALESCE(${rest.plateNumber ?? null}, plate_number),
        vehicle_profile_id = COALESCE(${rest.vehicleProfileId ?? null}, vehicle_profile_id),
        assigned_facility_id = COALESCE(${rest.assignedFacilityId ?? null}, assigned_facility_id),
        gps = ST_SetSRID(ST_MakePoint(${gps.longitude}, ${gps.latitude}), 4326),
        updated_at = NOW()
      WHERE id = ${id}
    `
  } else {
    await fastify.prisma.physicalVehicle.update({
      where: { id },
      data: rest,
    })
  }

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