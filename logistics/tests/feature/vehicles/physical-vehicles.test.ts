import { describe, test, expect, beforeAll, beforeEach } from "vitest"
import { physicalVehicles } from "../../../src/modules/vehicles/paths/physical-vehicle.path.js"
import { createVehicleProfile, createPhysicalVehicle } from "../../factory/vehicles.factory.js"
import { FastifyInstance } from "fastify"
import { createUser } from "../../factory/user.factory.js"
import { PhysicalVehicleStatus, UserRole } from "@prisma/client"

describe('Physical Vehicle Management', () => {
  let app: FastifyInstance
  let defaultFacilityId: number
  let headers: {}

  beforeAll(async () => {
    app = (globalThis as any).app as FastifyInstance
  })

  beforeEach(async () => {
    const admin = await createUser(app, UserRole.Admin)
    if (!admin.user.assignedFacilityId) {
      throw new Error("User doesn't have a facility.")
    }
    defaultFacilityId = admin.user.assignedFacilityId;
    headers = { authorization: `Bearer ${admin.token}` };
  })

  test('physical vehicles can be listed', async () => {
    await createPhysicalVehicle(app)

    const response = await app.inject({
      method: 'GET',
      url: physicalVehicles.index,
      headers
    })

    const body = response.json()
    const physicalVehicleData = body.data.physicalVehicles
    const vehicleStatusData = body.data.vehicleStatuses

    expect(response.statusCode).toBe(200)
    expect(body.message).toBe('Physical Vehicles retrieved successfully.')
    expect(Array.isArray(physicalVehicleData)).toBe(true)
    expect(physicalVehicleData.length).toBeGreaterThan(0)
    expect(physicalVehicleData[0]).toMatchObject({
      id: expect.any(Number),
      vehicleProfileId: expect.any(Number),
      assignedFacilityId: expect.any(Number),
      plateNumber: expect.any(String),
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    })

    expect(vehicleStatusData.length).toBeGreaterThan(0)
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
      headers,
      body: payload,
    })

    const body = response.json()

    expect(response.statusCode).toBe(201)
    expect(body.message).toBe('Physical Vehicle created successfully.')
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
      headers
    })

    const body = response.json()

    expect(response.statusCode).toBe(200)
    expect(body.message).toBe('Physical Vehicle retrieved successfully.')
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
      headers,
      body: updatePayload,
    })

    const body = response.json()

    expect(response.statusCode).toBe(200)
    expect(body.message).toBe('Physical Vehicle updated successfully.')
    expect(body.data).toMatchObject({
      id: createdVehicle.id,
      plateNumber: updatePayload.plateNumber,
    })
  })

  test('a physical vehicle can be marked as Available', async () => {
    const physicalVehicle = await createPhysicalVehicle(app, {
      status: PhysicalVehicleStatus.Maintenance
    })

    const response = await app.inject({
      method: 'PATCH',
      url: physicalVehicles.available(physicalVehicle.id),
      headers
    })

    const body = response.json()

    expect(body.message).toBe('Physical Vehicle marked as available successfully.')
    expect(body.data.status).toBe(PhysicalVehicleStatus.Available)

    const dbPhysicalVehicle = await app.prisma.physicalVehicle.findUniqueOrThrow({
      where: { id: physicalVehicle.id },
      include: { logs: true }
    })

    expect(dbPhysicalVehicle.logs).toHaveLength(2)
    expect(dbPhysicalVehicle.logs[0].status).toBe(PhysicalVehicleStatus.Maintenance)
    expect(dbPhysicalVehicle.logs[1].status).toBe(PhysicalVehicleStatus.Available)
  })

  test('a physical vehicle can be marked as InTransit', async () => {
    const physicalVehicle = await createPhysicalVehicle(app)

    const response = await app.inject({
      method: 'PATCH',
      url: physicalVehicles.inTransit(physicalVehicle.id),
      headers
    })

    const body = response.json()

    expect(body.message).toBe('Physical Vehicle marked as In Transit successfully.')
    expect(body.data.status).toBe(PhysicalVehicleStatus.InTransit)

    const dbPhysicalVehicle = await app.prisma.physicalVehicle.findUniqueOrThrow({
      where: { id: physicalVehicle.id },
      include: { logs: true }
    })

    expect(dbPhysicalVehicle.logs).toHaveLength(2)
    expect(dbPhysicalVehicle.logs[0].status).toBe(PhysicalVehicleStatus.Available)
    expect(dbPhysicalVehicle.logs[1].status).toBe(PhysicalVehicleStatus.InTransit)
  })

  test('a physical vehicle can be marked as Maintenance', async () => {
    const physicalVehicle = await createPhysicalVehicle(app)

    const response = await app.inject({
      method: 'PATCH',
      url: physicalVehicles.maintenance(physicalVehicle.id),
      headers
    })

    const body = response.json()

    expect(body.message).toBe('Physical Vehicle marked as Maintenance successfully.')
    expect(body.data.status).toBe(PhysicalVehicleStatus.Maintenance)

    const dbPhysicalVehicle = await app.prisma.physicalVehicle.findUniqueOrThrow({
      where: { id: physicalVehicle.id },
      include: { logs: true }
    })

    expect(dbPhysicalVehicle.logs).toHaveLength(2)
    expect(dbPhysicalVehicle.logs[0].status).toBe(PhysicalVehicleStatus.Available)
    expect(dbPhysicalVehicle.logs[1].status).toBe(PhysicalVehicleStatus.Maintenance)
  })

  test('a physical vehicle can be deleted', async () => {
    const createdVehicle = await createPhysicalVehicle(app)

    const response = await app.inject({
      method: 'DELETE',
      headers,
      url: physicalVehicles.delete(createdVehicle.id),
    })

    const body = response.json()

    expect(response.statusCode).toBe(200)
    expect(body.message).toBe('Physical Vehicle deleted successfully.')

    const deletedRecord = await app.prisma.physicalVehicle.findUnique({
      where: { id: createdVehicle.id },
    })
    expect(deletedRecord).toBeNull()
  })
})