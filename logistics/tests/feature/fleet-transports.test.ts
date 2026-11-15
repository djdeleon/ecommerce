import { describe, test, expect, beforeAll } from "vitest"
import { fleetTransports } from "../../src/modules/fleet-transports/paths.js"
import { createNetworkLeg } from "../factory/network-leg.factory.js"
import { createPhysicalVehicle, createFleetTransport } from "../factory/vehicles.factory.js"
import { FastifyInstance } from "fastify"
import { createUser } from "../factory/user.factory.js"
import { UserRole } from "@prisma/client"


describe('Fleet Transport Management', () => {
  let app: FastifyInstance

  beforeAll(() => {
    app = (globalThis as any).app as FastifyInstance
  })

  test('a fleet transport can be created', async () => {
    const { token } = await createUser(app, UserRole.Manager)

    const physicalVehicle = await createPhysicalVehicle(app)
    const networkLeg = await createNetworkLeg(app)

    const payload = {
      vehicleId: physicalVehicle.id,
      networkLegId: networkLeg.id,
      scheduledTime: "2026-10-21T08:00:00.000Z",
    }

    const response = await app.inject({
      method: 'POST',
      url: fleetTransports.store,
      headers: {
        authorization: `Bearer ${token}`
      },
      body: payload,
    })

    const body = response.json()

    expect(response.statusCode).toBe(201)
    expect(body.message).toBe('Fleet Transport created successfully.')
    expect(body.data).toMatchObject({
      id: expect.any(Number),
      vehicleId: payload.vehicleId,
      networkLegId: payload.networkLegId,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    })
  })

  test('a fleet transport can be updated', async () => {
    const { token } = await createUser(app, UserRole.Manager)

    const physicalVehicle = await createPhysicalVehicle(app)
    const createdSchedule = await createFleetTransport(app)

    const updatePayload = {
      vehicleId: physicalVehicle.id,
    }

    const response = await app.inject({
      method: 'PUT',
      url: fleetTransports.update(createdSchedule.id),
      headers: {
        authorization: `Bearer ${token}`
      },
      body: updatePayload,
    })

    const body = response.json()

    expect(response.statusCode).toBe(200)
    expect(body.message).toBe('Fleet Transport updated successfully.')
    expect(body.data).toMatchObject({
      id: createdSchedule.id,
      vehicleId: updatePayload.vehicleId,
    })
  })

  test('a fleet transport can be deleted', async () => {
    const createdSchedule = await createFleetTransport(app)

    const response = await app.inject({
      method: 'DELETE',
      url: fleetTransports.delete(createdSchedule.id),
    })

    const body = response.json()

    expect(response.statusCode).toBe(200)
    expect(body.message).toBe('Fleet Transport deleted successfully.')

    const deletedRecord = await app.prisma.fleetTransport.findUnique({
      where: { id: createdSchedule.id },
    })
    expect(deletedRecord).toBeNull()
  })
})