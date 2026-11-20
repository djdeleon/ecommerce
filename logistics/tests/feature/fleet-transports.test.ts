import { describe, test, expect, beforeAll, beforeEach } from "vitest"
import { fleetTransports } from "../../src/modules/fleet-transports/paths.js"
import { createNetworkLeg } from "../factory/network-leg.factory.js"
import { FastifyInstance } from "fastify"
import { createUser } from "../factory/user.factory.js"
import { UserRole } from "@prisma/client"
import { createFleetTransport } from "../factory/fleet-transport.factory.js"
import { createPhysicalVehicle } from "../factory/vehicles.factory.js"


describe('Fleet Transport Management', () => {
  let app: FastifyInstance
  let managerToken: string

  beforeAll(() => {
    app = (globalThis as any).app as FastifyInstance
  })

  beforeEach(async () => {
    const manager = await createUser(app, UserRole.Manager)
    managerToken = manager.token
  })

  const authHeaders = () => ({ authorization: `Bearer ${managerToken}` })

  test('a list of fleet transports can be retrieved', async () => {
    await createFleetTransport(app)
    await createFleetTransport(app)

    const response = await app.inject({
      method: 'GET',
      url: fleetTransports.index,
      headers: authHeaders()
    })

    const body = response.json()

    expect(response.statusCode).toBe(200)
    expect(body.message).toBe('Fleet Transports retrieved successfully.')
    expect(Array.isArray(body.data)).toBe(true)
    expect(body.data.length).toBeGreaterThanOrEqual(2)
  })

  test('a fleet transport can be created', async () => {
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
      headers: authHeaders(),
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

  test('a fleet transport can be retrieved by id', async () => {
    const createdSchedule = await createFleetTransport(app)

    const response = await app.inject({
      method: 'GET',
      url: fleetTransports.show(createdSchedule.id),
      headers: authHeaders()
    })

    const body = response.json()

    expect(response.statusCode).toBe(200)
    expect(body.message).toBe('Fleet Transport retrieved successfully.')
    expect(body.data).toMatchObject({
      id: createdSchedule.id,
      vehicleId: createdSchedule.vehicleId,
    })
  })

  test('a fleet transport can be updated', async () => {
    const physicalVehicle = await createPhysicalVehicle(app)
    const createdSchedule = await createFleetTransport(app)

    const updatePayload = {
      vehicleId: physicalVehicle.id,
    }

    const response = await app.inject({
      method: 'PUT',
      url: fleetTransports.update(createdSchedule.id),
      headers: authHeaders(),
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
      headers: authHeaders(),
    })

    const body = response.json()

    expect(response.statusCode).toBe(200)
    expect(body.message).toBe('Fleet Transport deleted successfully.')

    const deletedRecord = await app.prisma.fleetTransport.findUnique({
      where: { id: createdSchedule.id },
    })
    expect(deletedRecord).toBeNull()
  })

  test('a fleet transport can be dispatched', async () => {
    const createdSchedule = await createFleetTransport(app)

    const response = await app.inject({
      method: 'PATCH',
      url: fleetTransports.dispatch.url.replace(':id', String(createdSchedule.id)),
      headers: authHeaders(),
    })

    const body = response.json()

    expect(response.statusCode).toBe(200)
    expect(body.message).toBe('Transport run dispatched')
    expect(body.data.dispatchedAt).toBeTruthy()

    // Verify physical vehicle status cascade update
    const updatedVehicle = await app.prisma.physicalVehicle.findUnique({
      where: { id: createdSchedule.vehicleId }
    })
    expect(updatedVehicle?.status).toBe('Transit')
  })

  test('a dispatched fleet transport can arrive back at facility', async () => {
    const createdSchedule = await createFleetTransport(app)

    // First dispatch it
    await app.inject({
      method: 'PATCH',
      url: fleetTransports.dispatch.url.replace(':id', String(createdSchedule.id)),
      headers: authHeaders(),
    })

    // Then arrive it
    const response = await app.inject({
      method: 'PATCH',
      url: fleetTransports.arrive.url.replace(':id', String(createdSchedule.id)),
      headers: authHeaders(),
    })

    const body = response.json()

    expect(response.statusCode).toBe(200)
    expect(body.message).toBe('Transport run arrived back at facility')
    expect(body.data.arrivedAt).toBeTruthy()

    const updatedVehicle = await app.prisma.physicalVehicle.findUnique({
      where: { id: createdSchedule.vehicleId }
    })
    expect(updatedVehicle?.status).toBe('Available')
  })

  test('telemetry can be recorded for a fleet transport', async () => {
    const createdSchedule = await createFleetTransport(app)

    const telemetryPayload = {
      longitude: 120.9842,
      latitude: 14.5995,
      speed: 40,
      heading: 90
    }

    const response = await app.inject({
      method: 'POST',
      url: fleetTransports.telemetry.url.replace(':id', String(createdSchedule.id)),
      headers: authHeaders(),
      body: telemetryPayload,
    })

    const body = response.json()

    expect(response.statusCode).toBe(201)
    expect(body.message).toBe('Telemetry recorded successfully.')
    expect(body.data).toMatchObject({
      id: expect.any(Number),
      physicalVehicleId: createdSchedule.vehicleId,
      longitude: telemetryPayload.longitude,
      latitude: telemetryPayload.latitude,
      speed: telemetryPayload.speed,
      heading: telemetryPayload.heading,
    })
  })
})