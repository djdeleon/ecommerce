import { FastifyInstance } from "fastify";
import { CreateNetworkLegBody, UpdateNetworkLegBody } from "./schema.js";
import parseId from "#commons/utils/id-parser.js";
import { TransitMode } from "@prisma/client";
import { transitModeMap } from "./transitModeMap.js";

export async function createNetworkLeg(
  fastify: FastifyInstance, 
  data: CreateNetworkLegBody
) {
  const { 
    sourceFacilityId, 
    destinationFacilityId, 
    laneCode, 
    route, 
    distanceKm, 
    vehicleProfile, 
    baseTransitDuration, 
    mode, 
    cutOffTime 
  } = data

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
  `

  return networkLeg
}

export async function updateNetworkLeg(
  fastify: FastifyInstance,
  idParam: string,
  data: UpdateNetworkLegBody
) {
  const { 
    sourceFacilityId, 
    destinationFacilityId, 
    laneCode, 
    route, 
    distanceKm, 
    vehicleProfile, 
    baseTransitDuration, 
    mode, 
    cutOffTime 
  } = data
  const id = parseId(idParam)

  if (route) {
    await fastify.prisma.$executeRaw`
      UPDATE "network_legs"
      SET 
        source_facility_id = COALESCE(${sourceFacilityId ?? null}, source_facility_id),
        destination_facility_id = COALESCE(${destinationFacilityId ?? null}, destination_facility_id),
        lane_code = COALESCE(${laneCode ?? null}, lane_code),
        route = ST_SetSRID(ST_GeomFromGeoJSON(${JSON.stringify(route)}), 4326),
        distance_km = COALESCE(${distanceKm ?? null}, distance_km),
        vehicle_profile = COALESCE(${vehicleProfile ?? null}, vehicle_profile),
        base_transit_duration = COALESCE(${baseTransitDuration ?? null}, base_transit_duration),
        mode = COALESCE(${mode ?? null}::"transit_mode", mode),
        cut_off_time = COALESCE(${cutOffTime ?? null}::time, cut_off_time),
        updated_at = NOW()
      WHERE id = ${id}
    `
  } else {
    await fastify.prisma.networkLeg.update({
      where: { id },
      data: {
        ...(sourceFacilityId && { sourceFacilityId }),
        ...(destinationFacilityId && { destinationFacilityId }),
        ...(laneCode && { laneCode }),
        ...(distanceKm && { distanceKm }),
        ...(vehicleProfile && { vehicleProfile }),
        ...(baseTransitDuration && { baseTransitDuration }),
        ...(mode && { mode: mode as TransitMode }),
        ...(cutOffTime && { cutOffTime: new Date(`1970-01-01T${cutOffTime}Z`) }),
      },
    })
  }

  const [updatedLeg] = await fastify.prisma.$queryRaw<any[]>`
    SELECT 
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
    FROM "network_legs"
    WHERE id = ${id}
  `

  return updatedLeg
}

export async function deleteNetworkLeg(
  fastify: FastifyInstance,
  idParam: string
) {
  const id = parseId(idParam)

  return await fastify.prisma.networkLeg.delete({
    where: { id },
  })
}