import { API_ROUTES } from "#commons/constants/routes.js";
import { VehicleType } from "@prisma/client";
import { FastifyInstance } from "fastify";
import { beforeAll, describe, expect, test } from "vitest";
import { createCourierSchedule, createPhysicalVehicle, createVehicleProfile } from "../factory/vehicles.factory.js";
import { createCourier, createFacility } from "#factory";
import { createNetworkLeg } from "../factory/network-leg.factory.js";

describe('Vehicle Domain', () => {
  let app: FastifyInstance

  beforeAll(() => {
    app = (globalThis as any).app as FastifyInstance
  })

  describe('Vehicle Profile Management', () => {
    test('a vehicle profile can be create', async () => {
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
        url: API_ROUTES.vehicles.vehicleProfile.store,
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

    test('a vehicle profile can be updated', async () => {
      const createdProfile = await createVehicleProfile(app)
      const updatePayload = {
        variant: 'FB Body',
        maxWeightCapacityG: 1200000,
      }

      const response = await app.inject({
        method: 'PUT',
        url: API_ROUTES.vehicles.vehicleProfile.update(createdProfile.id),
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
        url: API_ROUTES.vehicles.vehicleProfile.delete(createdProfile.id),
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

  describe('Physical Vehicle Management', () => {
    test('a physical vehicle can be created', async () => {
      const vehicleProfile = await createVehicleProfile(app)
      const facility = await createFacility(app)
      const payload = {
        vehicleProfileId: vehicleProfile.id,
        assignedFacilityId: facility.id,
        plateNumber: 'ABC-1234',
        gps: {
          latitude: 14.5995,
          longitude: 120.9842,
        },
      }

      const response = await app.inject({
        method: 'POST',
        url: API_ROUTES.vehicles.physicalVehicle.store,
        body: payload,
      })

      const body = response.json()

      expect(response.statusCode).toBe(201)
      expect(body.message).toBe('Physical vehicle created successfully')
      expect(body.data).toMatchObject({
        id: expect.any(Number),
        vehicleProfileId: payload.vehicleProfileId,
        assignedFacilityId: payload.assignedFacilityId,
        plateNumber: payload.plateNumber,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      })
    })

    test('a physical vehicle can be updated', async () => {
      const createdVehicle = await createPhysicalVehicle(app)
      const updatePayload = {
        plateNumber: 'NEW-8888',
        gps: {
          latitude: 14.6000,
          longitude: 120.9900,
        }
      }

      const response = await app.inject({
        method: 'PUT',
        url: API_ROUTES.vehicles.physicalVehicle.update(createdVehicle.id),
        body: updatePayload,
      })

      const body = response.json()

      expect(response.statusCode).toBe(200)
      expect(body.message).toBe('Physical vehicle updated successfully')
      expect(body.data).toMatchObject({
        id: createdVehicle.id,
        plateNumber: updatePayload.plateNumber,
      })
    })

    test('a physical vehicle can be deleted', async () => {
      const createdVehicle = await createPhysicalVehicle(app)

      const response = await app.inject({
        method: 'DELETE',
        url: API_ROUTES.vehicles.physicalVehicle.delete(createdVehicle.id),
      })

      const body = response.json()

      expect(response.statusCode).toBe(200)
      expect(body.message).toBe('Physical vehicle deleted successfully')

      const deletedRecord = await app.prisma.physicalVehicle.findUnique({
        where: { id: createdVehicle.id },
      })
      expect(deletedRecord).toBeNull()
    })
  })

  describe('Courier Schedule Management', () => {
    test('a courier schedule can be created', async () => {
      const physicalVehicle = await createPhysicalVehicle(app)
      const networkLeg = await createNetworkLeg(app)

      const payload = {
        physicalVehicleId: physicalVehicle.id,
        networkLegId: networkLeg.id,
      }

      const response = await app.inject({
        method: 'POST',
        url: API_ROUTES.vehicles.courierSchedule.store,
        body: payload,
      })

      const body = response.json()

      expect(response.statusCode).toBe(201)
      expect(body.message).toBe('Courier schedule created successfully.')
      expect(body.data).toMatchObject({
        id: expect.any(Number),
        physicalVehicleId: payload.physicalVehicleId,
        networkLegId: payload.networkLegId,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      })
    })

    test('a courier schedule can be updated', async () => {
      const physicalVehicle = await createPhysicalVehicle(app)
      const createdSchedule = await createCourierSchedule(app)

      const updatePayload = {
        physicalVehicleId: physicalVehicle.id,
      }

      const response = await app.inject({
        method: 'PUT',
        url: API_ROUTES.vehicles.courierSchedule.update(createdSchedule.id),
        body: updatePayload,
      })

      const body = response.json()

      expect(response.statusCode).toBe(200)
      expect(body.message).toBe('Courier schedule updated successfully.')
      expect(body.data).toMatchObject({
        id: createdSchedule.id,
        physicalVehicleId: updatePayload.physicalVehicleId,
      })
    })

    test('a courier schedule can be deleted', async () => {
      const createdSchedule = await createCourierSchedule(app)

      const response = await app.inject({
        method: 'DELETE',
        url: API_ROUTES.vehicles.courierSchedule.delete(createdSchedule.id),
      })

      const body = response.json()

      expect(response.statusCode).toBe(200)
      expect(body.message).toBe('Courier schedule deleted successfully.')

      const deletedRecord = await app.prisma.courierSchedule.findUnique({
        where: { id: createdSchedule.id },
      })
      expect(deletedRecord).toBeNull()
    })
  })

  describe('Dispatch Log Management', () => {
    test('a dispatch log can be created', async () => {
      const courier = await createCourier()
      const facility = await createFacility(app)

      const payload = {
        assignedCourierId: courier.id,
        originFacilityId: facility.id,
        dispatchedAt: new Date().toISOString(),
      }

      const response = await app.inject({
        method: 'POST',
        url: API_ROUTES.vehicles.dispatchLog.store, // Ensure you have this path defined in API_ROUTES
        body: payload,
      })

      const body = response.json()

      expect(response.statusCode).toBe(201)
      expect(body.message).toBe('Dispatch log created successfully.')
      expect(body.data).toMatchObject({
        id: expect.any(Number),
        assignedCourierId: payload.assignedCourierId,
        originFacilityId: payload.originFacilityId,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      })
    })

    test('a dispatch log can be updated', async () => {
      const courier = await createCourier()

      const createdLog = await app.prisma.dispatchLog.create({
        data: {
          assignedCourierId: courier.id,
          dispatchedAt: new Date(),
        }
      })

      const updatePayload = {
        arrivedAt: new Date().toISOString(),
      }

      const response = await app.inject({
        method: 'PUT',
        url: API_ROUTES.vehicles.dispatchLog.update(createdLog.id),
        body: updatePayload,
      })

      const body = response.json()

      expect(response.statusCode).toBe(200)
      expect(body.message).toBe('Dispatch log updated successfully.')
      expect(body.data).toMatchObject({
        id: createdLog.id,
        arrivedAt: expect.any(String),
      })
    })

    test('a dispatch log can be deleted', async () => {
      const courier = await createCourier()

      const createdLog = await app.prisma.dispatchLog.create({
        data: {
          assignedCourierId: courier.id,
          dispatchedAt: new Date(),
        }
      })

      const response = await app.inject({
        method: 'DELETE',
        url: API_ROUTES.vehicles.dispatchLog.delete(createdLog.id),
      })

      const body = response.json()

      expect(response.statusCode).toBe(200)
      expect(body.message).toBe('Dispatch log deleted successfully.')

      const deletedRecord = await app.prisma.dispatchLog.findUnique({
        where: { id: createdLog.id },
      })
      expect(deletedRecord).toBeNull()
    })
  })
})