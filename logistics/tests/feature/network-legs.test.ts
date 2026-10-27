import { FastifyInstance } from "fastify";
import { beforeAll, describe, expect, test } from "vitest";
import { createFacility } from "#factory";
import { TransitMode } from "@prisma/client";
import { transitModeMap } from "../../src/modules/network-legs/transitModeMap.js";
import { createNetworkLeg } from "../factory/network-leg.factory.js";
import { networkLegs } from "../../src/modules/network-legs/paths.js";

describe('Network Leg Domain', () => {
  let app: FastifyInstance

  beforeAll(() => {
    app = (globalThis as any).app as FastifyInstance
  })

  test('a network leg can be created', async () => {
    const sourceFacility = await createFacility(app, { name: 'Origin Hub' })
    const destinationFacility = await createFacility(app, { name: 'Destination Hub' })

    const payload = {
      sourceFacilityId: sourceFacility.id,
      destinationFacilityId: destinationFacility.id,
      laneCode: 'ORG-DST-HL',
      route: {
        type: "LineString",
        coordinates: [
          [120.98, 14.75],
          [121.05, 14.80],
          [121.10, 14.85]
        ]
      },
      distanceMtr: 45,
      vehicleProfile: 'Aluminum Van',
      baseTransitDuration: 7200, // 2 hours in seconds
      mode: TransitMode.HighwayLinehaul,
      cutOffTime: '18:00:00'
    }

    const response = await app.inject({
      method: 'POST',
      url: networkLegs.store,
      body: payload
    })

    const body = response.json()

    expect(response.statusCode).toBe(201)
    expect(body.message).toBe('Network leg created successfully.')
    expect(body.data).toMatchObject({
      id: expect.any(Number),
      sourceFacilityId: payload.sourceFacilityId,
      destinationFacilityId: payload.destinationFacilityId,
      laneCode: payload.laneCode,
      distanceMtr: payload.distanceMtr,
      vehicleProfile: payload.vehicleProfile,
      baseTransitDuration: payload.baseTransitDuration,
      mode: transitModeMap[payload.mode],
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    })
  })

  test('a network leg can be updated', async () => {
    const createdLeg = await createNetworkLeg(app)

    const updatePayload = {
      laneCode: 'UPDATED-LANE',
      distanceMtr: 50,
      mode: TransitMode.HighwayLinehaul,
    }

    const response = await app.inject({
      method: 'PUT',
      url: networkLegs.update(createdLeg.id),
      body: updatePayload
    })

    const body = response.json()

    expect(response.statusCode).toBe(200)
    expect(body.message).toBe('Network leg updated successfully.')
    expect(body.data).toMatchObject({
      id: createdLeg.id,
      laneCode: updatePayload.laneCode,
      distanceMtr: updatePayload.distanceMtr,
      mode: transitModeMap[updatePayload.mode]
    })
  })

  test('a network leg can be deleted', async () => {
    const createdLeg = await createNetworkLeg(app)

    const response = await app.inject({
      method: 'DELETE',
      url: networkLegs.delete(createdLeg.id),
    })

    const body = response.json()

    expect(response.statusCode).toBe(200)
    expect(body.message).toBe('Network leg deleted successfully.')

    const deletedRecord = await app.prisma.networkLeg.findUnique({
      where: { id: createdLeg.id },
    })
    expect(deletedRecord).toBeNull()
  })
})