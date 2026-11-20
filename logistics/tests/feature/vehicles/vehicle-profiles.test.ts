import { VehicleType, UserRole } from "@prisma/client"
import { FastifyInstance } from "fastify"
import { describe, beforeEach, test, expect, beforeAll } from "vitest"
import { vehicleProfiles } from "../../../src/modules/vehicles/paths/vehicle-profile.path.js"
import { createVehicleProfile } from "../../factory/vehicles.factory.js"
import { createUser } from "../../factory/user.factory.js"

describe('Vehicle Profile Management', () => {
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

  test('vehicle profiles can be listed', async () => {
    await createVehicleProfile(app)

    const response = await app.inject({
      method: 'GET',
      url: vehicleProfiles.index,
      headers: authHeaders(),
    })

    const body = response.json()

    expect(response.statusCode).toBe(200)
    expect(body.message).toBe('Vehicle profiles retrieved successfully')
    expect(Array.isArray(body.data)).toBe(true)
    expect(body.data.length).toBeGreaterThan(0)
    expect(body.data[0]).toMatchObject({
      id: expect.any(Number),
      brand: expect.any(String),
      modelName: expect.any(String),
      variant: expect.any(String),
      maxWeightCapacityG: expect.any(Number),
      maxUsableVolumeCbm: expect.any(Number),
      allocationVolumeTarget: expect.any(Number),
      lengthMm: expect.any(Number),
      widthMm: expect.any(Number),
      heightMm: expect.any(Number),
      type: expect.any(String),
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    })
  })

  test('a vehicle profile can be created', async () => {
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
      type: VehicleType.Van
    }

    const response = await app.inject({
      method: 'POST',
      url: vehicleProfiles.store,
      headers: authHeaders(),
      body: payload
    })

    const body = response.json()

    expect(response.statusCode).toBe(201)
    expect(body.message).toBe('Vehicle profile created successfully')
    expect(body.data).toMatchObject({
      id: expect.any(Number),
      brand: payload.brand,
      modelName: payload.modelName,
      variant: payload.variant,
      maxWeightCapacityG: payload.maxWeightCapacityG,
      maxUsableVolumeCbm: payload.maxUsableVolumeCbm,
      allocationVolumeTarget: payload.allocationVolumeTarget,
      lengthMm: payload.lengthMm,
      widthMm: payload.widthMm,
      heightMm: payload.heightMm,
      type: payload.type,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    })
  })

  test('a vehicle profile can be fetched by id', async () => {
    const createdProfile = await createVehicleProfile(app)

    const response = await app.inject({
      method: 'GET',
      url: vehicleProfiles.show(createdProfile.id),
      headers: authHeaders(),
    })

    const body = response.json()

    expect(response.statusCode).toBe(200)
    expect(body.message).toBe('Vehicle profile retrieved successfully')
    expect(body.data).toMatchObject({
      id: createdProfile.id,
      brand: createdProfile.brand,
      modelName: createdProfile.modelName,
    })
  })

  test('a vehicle profile can be updated', async () => {
    const createdProfile = await createVehicleProfile(app)
    const updatePayload = {
      variant: 'FB Body',
      maxWeightCapacityG: 1200000,
    }

    const response = await app.inject({
      method: 'PUT',
      url: vehicleProfiles.update(createdProfile.id),
      headers: authHeaders(),
      body: updatePayload
    })

    const body = response.json()

    expect(response.statusCode).toBe(200)
    expect(body.message).toBe('Vehicle profile updated successfully')
    expect(body.data).toMatchObject({
      id: createdProfile.id,
      variant: updatePayload.variant,
      maxWeightCapacityG: updatePayload.maxWeightCapacityG,
    })
  })

  test('a vehicle profile can be deleted', async () => {
    const createdProfile = await createVehicleProfile(app)

    const response = await app.inject({
      method: 'DELETE',
      url: vehicleProfiles.delete(createdProfile.id),
      headers: authHeaders(),
    })

    const body = response.json()

    expect(response.statusCode).toBe(200)
    expect(body.message).toBe('Vehicle profile deleted successfully')

    const deletedRecord = await app.prisma.vehicleProfile.findUnique({
      where: { id: createdProfile.id },
    })
    expect(deletedRecord).toBeNull()
  })
})