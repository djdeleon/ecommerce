import { FastifyInstance } from "fastify";
import { createFacility } from "./facility.factory.js";
import { TransitMode } from "@prisma/client";
import { transitModeMap } from "../../src/modules/network-legs/transitModeMap.js";

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
  const distanceKm = (overrides as any).distanceKm ?? 45;
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

  const transitMode = transitModeMap[mode]

  const [networkLeg] = await fastify.prisma.$queryRaw<any[]>`
    INSERT INTO "network_legs" (
      "source_facility_id", 
      "destination_facility_id", 
      "lane_code", 
      "route", 
      "distance_km", 
      "vehicle_profile", 
      "base_transit_duration", 
      "mode", 
      "cut_off_time", 
      "created_at", 
      "updated_at"
    )
    VALUES (
      ${sourceFacilityId}, 
      ${destinationFacilityId}, 
      ${laneCode}, 
      ST_SetSRID(ST_GeomFromGeoJSON(${JSON.stringify(route)}), 4326),
      ${distanceKm}, 
      ${vehicleProfile}, 
      ${baseTransitDuration}, 
      ${transitMode}::"transit_mode", 
      ${cutOffTime}::time,
      NOW(),
      NOW()
    )
    RETURNING 
      id, 
      "source_facility_id" AS "sourceFacilityId", 
      "destination_facility_id" AS "destinationFacilityId", 
      "lane_code" AS "laneCode", 
      "distance_km" AS "distanceKm", 
      "vehicle_profile" AS "vehicleProfile", 
      "base_transit_duration" AS "baseTransitDuration", 
      mode, 
      "cut_off_time" AS "cutOffTime", 
      "created_at" AS "createdAt", 
      "updated_at" AS "updatedAt"
  `;

  return networkLeg;
}