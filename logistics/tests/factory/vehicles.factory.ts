import { VehicleType } from "@prisma/client";
import { FastifyInstance } from "fastify";
import { createFacility } from "./facility.factory.js";
import { createNetworkLeg } from "./network-leg.factory.js";

export async function createVehicleProfile(
  fastify: FastifyInstance,
  overrides?: Record<string, any>
) {
  return await fastify.prisma.vehicleProfile.create({
    data: {
      brand: 'Mitsubishi',
      modelName: 'L300',
      variant: 'Aluminum Van',
      maxWeightCapacityG: 1000000,
      maxUsableVolumeCbm: 3.3,
      allocationVolumeTarget: 0.75,
      lengthMm: 4200,
      widthMm: 1700,
      heightMm: 1900,
      type: VehicleType.Van,
      ...overrides,
    },
  })
}

export async function createPhysicalVehicle(
  fastify: FastifyInstance,
  overrides?: Record<string, any>
) {
  // 1. If profile or facility IDs aren't provided, create them automatically
  let vehicleProfileId = overrides?.vehicleProfileId;
  if (!vehicleProfileId) {
    const profile = await createVehicleProfile(fastify);
    vehicleProfileId = profile.id;
  }

  let assignedFacilityId = overrides?.assignedFacilityId;
  if (!assignedFacilityId) {
    const facility = await createFacility(fastify);
    assignedFacilityId = facility.id;
  }

  const plateNumber = overrides?.plateNumber ?? `ABC-${Math.floor(1000 + Math.random() * 9000)}`;
  const longitude = overrides?.longitude ?? 120.9842;
  const latitude = overrides?.latitude ?? 14.5995;

  // 2. Insert using raw SQL to handle PostGIS geometry points correctly
  const [physicalVehicle] = await fastify.prisma.$queryRaw<any[]>`
    INSERT INTO physical_vehicles (vehicle_profile_id, assigned_facility_id, plate_number, gps, created_at, updated_at)
    VALUES (
      ${vehicleProfileId}, 
      ${assignedFacilityId}, 
      ${plateNumber}, 
      ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326),
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
  `;

  return physicalVehicle;
}

export async function createCourierSchedule(
  fastify: FastifyInstance,
  overrides?: Record<string, any>
) {
  let physicalVehicleId = overrides?.physicalVehicleId;
  if (!physicalVehicleId) {
    const physicalVehicle = await createPhysicalVehicle(fastify);
    physicalVehicleId = physicalVehicle.id;
  }

  let networkLegId = overrides?.networkLegId;
  if (!networkLegId) {
    const networkLeg = await createNetworkLeg(fastify);
    networkLegId = networkLeg.id;
  }

  const courierId = overrides?.courierId ?? null;

  return await fastify.prisma.courierSchedule.create({
    data: {
      physicalVehicleId,
      networkLegId,
      courierId,
      ...overrides,
    },
  });
}