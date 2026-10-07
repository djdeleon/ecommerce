import { API_ROUTES } from "#commons/constants/routes.js";
import { VehicleType } from "@prisma/client";
import { FastifyInstance } from "fastify";
import { describe, expect, test } from "vitest";
import { createPhysicalVehicle, createVehicleProfile } from "../factory/vehicles.factory.js";
import { createFacility } from "#factory";

describe('Vehicle Domain', () => {
  describe('Vehicle Profile Management', () => {
    test('a vehicle profile can be create', async () => {
      const app = (globalThis as any).app as FastifyInstance
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
      const app = (globalThis as any).app as FastifyInstance
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
      const app = (globalThis as any).app as FastifyInstance
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

  describe('Physical Vehicle Management', async () => {
    test('a physical vehicle can be created', async () => {
      const app = (globalThis as any).app as FastifyInstance
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
      const app = (globalThis as any).app as FastifyInstance
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
      const app = (globalThis as any).app as FastifyInstance

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
})