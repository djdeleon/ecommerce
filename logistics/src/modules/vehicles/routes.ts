import { FastifyInstance } from "fastify";
import { CreateVehicleProfile, CreateVehicleSchema, DeleteVehicleParams, DeleteVehicleSchema, UpdateVehicleBody, UpdateVehicleParams, UpdateVehicleSchema, VEHICLE_PROFILE_PATHS } from "./schemas/vehicle-profile.schema.js";
import { VehicleType } from "@prisma/client";
import parseId from "#commons/utils/id-parser.js";
import { CreatePhysicalVehicleBody, CreatePhysicalVehicleSchema, DeletePhysicalVehicleParams, DeletePhysicalVehicleSchema, PHYSICAL_VEHICLE_PATHS, UpdatePhysicalVehicleBody, UpdatePhysicalVehicleParams, UpdatePhysicalVehicleSchema } from "./schemas/physical-vehicle.schema.js";

export async function vehicleProfileRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: CreateVehicleProfile }>(VEHICLE_PROFILE_PATHS.store, { schema: CreateVehicleSchema }, async (req, rep) => {
    const vehicleProfile = await fastify.prisma.vehicleProfile.create({
      data: {
        ...req.body,
        type: req.body.type as unknown as VehicleType,
      },
    })

    return rep.code(201).send({
      message: 'Vehicle profile created successfully',
      data: vehicleProfile,
    })
  })

  fastify.put<{ Body: UpdateVehicleBody; Params: UpdateVehicleParams }>(
    VEHICLE_PROFILE_PATHS.update,
    { schema: UpdateVehicleSchema },
    async (req, rep) => {
      const { vehicleProfileId } = req.params

      const updatedProfile = await fastify.prisma.vehicleProfile.update({
        where: { id: parseId(vehicleProfileId) },
        data: {
          ...req.body,
          ...(req.body.type && { type: req.body.type as unknown as VehicleType }),
        },
      })

      return rep.code(200).send({
        message: 'Vehicle profile updated successfully',
        data: updatedProfile,
      })
    }
  )

  fastify.delete<{ Params: DeleteVehicleParams }>(
    VEHICLE_PROFILE_PATHS.delete,
    { schema: DeleteVehicleSchema },
    async (req, rep) => {
      const { vehicleProfileId } = req.params

      await fastify.prisma.vehicleProfile.delete({
        where: { id: parseId(vehicleProfileId) },
      })

      return rep.code(200).send({
        message: 'Vehicle profile deleted successfully',
      })
    }
  )
}

export async function physicalVehicleRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: CreatePhysicalVehicleBody }>(
    PHYSICAL_VEHICLE_PATHS.store,
    { schema: CreatePhysicalVehicleSchema },
    async (req, rep) => {
      const { gps, ...rest } = req.body

      // Create record and insert PostGIS point using raw SQL via transaction or direct execution
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

      return rep.code(201).send({
        message: 'Physical vehicle created successfully',
        data: physicalVehicle,
      })
    }
  )

  fastify.put<{ Body: UpdatePhysicalVehicleBody; Params: UpdatePhysicalVehicleParams }>(
    PHYSICAL_VEHICLE_PATHS.update,
    { schema: UpdatePhysicalVehicleSchema },
    async (req, rep) => {
      const { physicalVehicleId } = req.params
      const { gps, ...rest } = req.body
      const id = parseId(physicalVehicleId)

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

      return rep.code(200).send({
        message: 'Physical vehicle updated successfully',
        data: updatedVehicle,
      })
    }
  )

  fastify.delete<{ Params: DeletePhysicalVehicleParams }>(
    PHYSICAL_VEHICLE_PATHS.delete,
    { schema: DeletePhysicalVehicleSchema },
    async (req, rep) => {
      const { physicalVehicleId } = req.params
      const id = parseId(physicalVehicleId)

      await fastify.prisma.physicalVehicle.delete({
        where: { id },
      })

      return rep.code(200).send({
        message: 'Physical vehicle deleted successfully',
      })
    }
  )
}