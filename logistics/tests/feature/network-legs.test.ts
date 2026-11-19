import { FastifyInstance } from "fastify";
import { beforeAll, beforeEach, describe, expect, test } from "vitest";
import { createFacility } from "#factory";
import { TransitMode, UserRole } from "@prisma/client";
import { transitModeMap } from "../../src/modules/network-legs/transitModeMap.js";
import { createNetworkLeg } from "../factory/network-leg.factory.js";
import { networkLegs } from "../../src/modules/network-legs/paths.js";
import { createUser } from "../factory/user.factory.js";

describe('Network Leg Domain', () => {
  let app: FastifyInstance
  let adminToken: string

  beforeAll(async () => {
    app = (globalThis as any).app as FastifyInstance
  })

  beforeEach(async () => {
    const admin = await createUser(app, UserRole.Admin)
    adminToken = admin.token
  })

  const authHeaders = () => ({ authorization: `Bearer ${adminToken}` })

  test('all network legs can be listed', async () => {
    await createNetworkLeg(app)
    await createNetworkLeg(app)

    const response = await app.inject({
      method: 'GET',
      url: networkLegs.index,
      headers: authHeaders(),
    })

    const body = response.json()

    expect(response.statusCode).toBe(200)
    expect(body.message).toBe('Network legs retrieved successfully.')
    expect(Array.isArray(body.data)).toBe(true)
    expect(body.data.length).toBeGreaterThanOrEqual(2)
    expect(body.data[0]).toMatchObject({
      id: expect.any(Number),
      sourceFacilityId: expect.any(Number),
      destinationFacilityId: expect.any(Number),
      laneCode: expect.any(String),
      distanceMtr: expect.any(Number),
      vehicleProfile: expect.any(String),
      baseTransitDuration: expect.any(Number),
      mode: expect.any(String),
      cutOffTime: expect.any(String),
      sourceFacility: expect.any(Object),
      destinationFacility: expect.any(Object),
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    })
  })

  test('a network leg can be retrieved by id', async () => {
    const createdLeg = await createNetworkLeg(app)

    const response = await app.inject({
      method: 'GET',
      url: networkLegs.show(createdLeg.id),
      headers: authHeaders(),
    })

    const body = response.json()

    expect(response.statusCode).toBe(200)
    expect(body.message).toBe('Network leg retrieved successfully.')
    expect(body.data).toMatchObject({
      id: createdLeg.id,
      laneCode: createdLeg.laneCode,
    })
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
      baseTransitDuration: 7200,
      mode: TransitMode.HighwayLinehaul,
      cutOffTime: '18:00:00'
    }

    const response = await app.inject({
      method: 'POST',
      url: networkLegs.store,
      headers: authHeaders(),
      body: payload
    })

    const body = response.json()

    expect(response.statusCode).toBe(201)
    expect(body.message).toBe('Network leg created successfully.')
    expect(body.data).toMatchObject({
      id: expect.any(Number),
      laneCode: payload.laneCode,
      distanceMtr: payload.distanceMtr,
      mode: transitModeMap[payload.mode],
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
      headers: authHeaders(),
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
      headers: authHeaders(),
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