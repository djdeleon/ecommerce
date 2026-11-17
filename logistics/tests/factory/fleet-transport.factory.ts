import { FastifyInstance } from "fastify";
import { createFacility } from "./facility.factory.js";
import { createNetworkLeg } from "./network-leg.factory.js";
import { createPhysicalVehicle } from "./vehicles.factory.js";

export async function createFleetTransport(
  fastify: FastifyInstance,
  overrides?: Record<string, any>
) {
  let vehicleId = overrides?.vehicleId ?? overrides?.physicalVehicleId;
  if (!vehicleId) {
    const physicalVehicle = await createPhysicalVehicle(fastify);
    vehicleId = physicalVehicle.id;
  }

  let networkLegId = overrides?.networkLegId;
  if (networkLegId === undefined) {
    const networkLeg = await createNetworkLeg(fastify);
    networkLegId = networkLeg.id;
  }

  let facilityId = overrides?.facilityId;
  if (facilityId === undefined) {
    const facility = await createFacility(fastify);
    facilityId = facility.id;
  }

  const courierId = overrides?.courierId ?? null;

  return await fastify.prisma.fleetTransport.create({
    data: {
      facilityId,
      vehicleId,
      networkLegId: networkLegId ?? null,
      courierId,
      scheduledTime: new Date(),
      ...overrides,
    },
  });
}