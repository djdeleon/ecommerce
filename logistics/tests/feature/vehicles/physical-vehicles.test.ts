import { describe, test, expect, beforeAll, beforeEach } from "vitest"
import { physicalVehicles } from "../../../src/modules/vehicles/paths/physical-vehicle.path.js"
import { createVehicleProfile, createPhysicalVehicle } from "../../factory/vehicles.factory.js"
import { FastifyInstance } from "fastify"
import { createUser } from "../../factory/user.factory.js"
import { UserRole } from "@prisma/client"

describe('Physical Vehicle Management', () => {
  let app: FastifyInstance
  let adminToken: string
  let defaultFacilityId: number

  beforeEach(async () => {
    app = (globalThis as any).app as FastifyInstance
    const admin = await createUser(app, UserRole.Admin)
    if (!admin.user.assignedFacilityId) {
      throw new Error("User doesn't have a facility.")
    }
    adminToken = admin.token
    defaultFacilityId = admin.user.assignedFacilityId
  })

  const authHeaders = () => ({ authorization: `Bearer ${adminToken}` })

  test('physical vehicles can be listed', async () => {
    await createPhysicalVehicle(app)

    const response = await app.inject({
      method: 'GET',
      url: physicalVehicles.index,
      headers: authHeaders(),
    })

    const body = response.json()

    expect(response.statusCode).toBe(200)
    expect(body.message).toBe('Physical vehicles retrieved successfully.')
    expect(Array.isArray(body.data)).toBe(true)
    expect(body.data.length).toBeGreaterThan(0)
    expect(body.data[0]).toMatchObject({
      id: expect.any(Number),
      vehicleProfileId: expect.any(Number),
      assignedFacilityId: expect.any(Number),
      plateNumber: expect.any(String),
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    })
  })

  test('a physical vehicle can be created', async () => {
    const vehicleProfile = await createVehicleProfile(app)
    const payload = {
      vehicleProfileId: vehicleProfile.id,
      assignedFacilityId: defaultFacilityId,
      plateNumber: 'ABC-1234',
    }

    const response = await app.inject({
      method: 'POST',
      url: physicalVehicles.store,
      headers: authHeaders(),
      body: payload,
    })

    const body = response.json()

    expect(response.statusCode).toBe(201)
    expect(body.message).toBe('Physical vehicle created successfully.')
    expect(body.data).toMatchObject({
      id: expect.any(Number),
      vehicleProfileId: payload.vehicleProfileId,
      assignedFacilityId: payload.assignedFacilityId,
      plateNumber: payload.plateNumber,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    })
  })

  test('a physical vehicle can be fetched by id', async () => {
    const createdVehicle = await createPhysicalVehicle(app)

    const response = await app.inject({
      method: 'GET',
      url: physicalVehicles.show(createdVehicle.id),
      headers: authHeaders(),
    })

    const body = response.json()

    expect(response.statusCode).toBe(200)
    expect(body.message).toBe('Physical vehicle retrieved successfully.')
    expect(body.data).toMatchObject({
      id: createdVehicle.id,
      plateNumber: createdVehicle.plateNumber,
    })
  })

  test('a physical vehicle can be updated', async () => {
    const createdVehicle = await createPhysicalVehicle(app)
    const updatePayload = {
      plateNumber: 'NEW-8888',
    }

    const response = await app.inject({
      method: 'PUT',
      url: physicalVehicles.update(createdVehicle.id),
      headers: authHeaders(),
      body: updatePayload,
    })

    const body = response.json()

    expect(response.statusCode).toBe(200)
    expect(body.message).toBe('Physical vehicle updated successfully.')
    expect(body.data).toMatchObject({
      id: createdVehicle.id,
      plateNumber: updatePayload.plateNumber,
    })
  })

  test('a physical vehicle can be deleted', async () => {
    const createdVehicle = await createPhysicalVehicle(app)

    const response = await app.inject({
      method: 'DELETE',
      headers: authHeaders(),
      url: physicalVehicles.delete(createdVehicle.id),
    })

    const body = response.json()

    expect(response.statusCode).toBe(200)
    expect(body.message).toBe('Physical vehicle deleted successfully.')

    const deletedRecord = await app.prisma.physicalVehicle.findUnique({
      where: { id: createdVehicle.id },
    })
    expect(deletedRecord).toBeNull()
  })
})