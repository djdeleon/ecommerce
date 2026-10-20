import { FastifyInstance } from "fastify";
import { createFacility } from "./facility.factory.js";
import { TransitMode } from "@prisma/client";
import { createNetworkLeg as createNetworkLegService } from "../../src/modules/network-legs/service.js";

export async function createNetworkLeg(fastify: FastifyInstance, overrides = {}) {
  const randomSuffix = Math.floor(Math.random() * 10000);

  let sourceFacilityId = (overrides as any).sourceFacilityId;
  if (!sourceFacilityId) {
    const facility = await createFacility(fastify, { name: `Origin Hub ${randomSuffix}` });
    sourceFacilityId = facility.id;
  }

  let destinationFacilityId = (overrides as any).destinationFacilityId;
  if (!destinationFacilityId) {
    const facility = await createFacility(fastify, { name: `Destination Hub ${randomSuffix}` });
    destinationFacilityId = facility.id;
  }

  const laneCode = (overrides as any).laneCode ?? `LANE-${randomSuffix}`;
  const distanceMtr = (overrides as any).distanceMtr ?? 45;
  const vehicleProfile = (overrides as any).vehicleProfile ?? 'Aluminum Van';
  const baseTransitDuration = (overrides as any).baseTransitDuration ?? 7200;
  const mode = (overrides as any).mode ?? TransitMode.HighwayLinehaul;
  const cutOffTime = (overrides as any).cutOffTime ?? '18:00:00';

  const route = (overrides as any).route ?? {
    type: "LineString",
    coordinates: [
      [120.98, 14.75],
      [121.05, 14.80]
    ]
  };

  return await createNetworkLegService(fastify, {
    sourceFacilityId,
    destinationFacilityId,
    laneCode,
    distanceMtr,
    vehicleProfile,
    baseTransitDuration,
    mode,
    cutOffTime,
    route,
  })
}