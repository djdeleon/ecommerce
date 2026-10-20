import { VehicleType } from "@prisma/client";
import { FastifyInstance } from "fastify";
import { createFacility } from "./facility.factory.js";
import { createNetworkLeg } from "./network-leg.factory.js";
import { createVehicleProfile as createVehicleProfileService } from "../../src/modules/vehicles/services/vehicle-profile.service.js";
import { createPhysicalVehicle as createPhysicalVehicleService } from "../../src/modules/vehicles/services/physical-vehicle.service.js";

export async function createVehicleProfile(
  fastify: FastifyInstance,
  overrides?: Record<string, any>
) {
  const payload = {
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
  }

  return await createVehicleProfileService(fastify, payload)
}

export async function createPhysicalVehicle(
  fastify: FastifyInstance,
  overrides?: Record<string, any>
) {

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

  return await createPhysicalVehicleService(fastify, {
    vehicleProfileId,
    assignedFacilityId,
    plateNumber
  })
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