import { API_ROUTES } from "#commons/constants/routes.js";
import { FastifyInstance } from "fastify";
import { beforeAll, describe, expect, test } from "vitest";
import { createFacility } from "#factory";
import { MasterBagStatus, SortationBatchStatus } from "@prisma/client";
import { createCourierSchedule } from "../factory/vehicles.factory.js";
import { createFacilityChute, createMasterBag, createSortingBatch } from "../factory/sortation.factory.js";

describe('Sortation Domain', () => {
  describe('Sorting Batch Management', () => {
    let app: FastifyInstance

    beforeAll(() => {
      app = (globalThis as any).app as FastifyInstance
    })

    test('a sortation batch can be created', async () => {
      const facility = await createFacility(app)

      const payload = {
        code: 'BATCH-2026-001',
        facilityId: facility.id,
        status: SortationBatchStatus.Scheduled,
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 3600000).toISOString(),
      }

      const response = await app.inject({
        method: 'POST',
        url: API_ROUTES.sortations.sortingBatch.store,
        body: payload
      })

      const body = response.json()

      expect(response.statusCode).toBe(201)
      expect(body.message).toBe('Sortation batch created successfully.')
      expect(body.data).toMatchObject({
        id: expect.any(Number),
        code: payload.code,
        facilityId: payload.facilityId,
        status: payload.status,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      })
    })

    test('a sortation batch can be updated', async () => {
      const createdBatch = await createSortingBatch(app)

      const updatePayload = {
        code: 'BATCH-2026-002',
        status: SortationBatchStatus.Active,
      }

      const response = await app.inject({
        method: 'PUT',
        url: API_ROUTES.sortations.sortingBatch.update(createdBatch.id),
        body: updatePayload
      })

      const body = response.json()

      expect(response.statusCode).toBe(200)
      expect(body.message).toBe('Sortation batch updated successfully.')
      expect(body.data).toMatchObject({
        id: createdBatch.id,
        code: updatePayload.code,
        status: updatePayload.status,
      })
    })

    test('a sortation batch can be deleted', async () => {
      const createdBatch = await createSortingBatch(app)

      const response = await app.inject({
        method: 'DELETE',
        url: API_ROUTES.sortations.sortingBatch.delete(createdBatch.id),
      })

      const body = response.json()

      expect(response.statusCode).toBe(200)
      expect(body.message).toBe('Sortation batch deleted successfully.')

      const deletedRecord = await app.prisma.sortationBatch.findUnique({
        where: { id: createdBatch.id },
      })
      expect(deletedRecord).toBeNull()
    })
  })

  describe('Master Bag Management', () => {
    let app: FastifyInstance

    beforeAll(() => {
      app = (globalThis as any).app as FastifyInstance
    })

    test('a master bag can be created', async () => {
      const facilityCurrent = await createFacility(app)
      const facilityNext = await createFacility(app)
      const courierSchedule = await createCourierSchedule(app)
      const sortingBatch = await app.prisma.sortationBatch.create({
        data: {
          code: 'BATCH-BAG-001',
          facilityId: facilityCurrent.id,
          status: SortationBatchStatus.Active,
        }
      })

      const payload = {
        code: 'BAG-2026-0001',
        courierScheduleId: courierSchedule.id,
        sortingBatchId: sortingBatch.id,
        currentFacilityId: facilityCurrent.id,
        nextFacilityId: facilityNext.id,
        totalWeight: 5000, // in grams
        totalParcels: 10,
        status: MasterBagStatus.Open,
      }

      const response = await app.inject({
        method: 'POST',
        url: API_ROUTES.sortations.masterBag.store,
        body: payload
      })

      const body = response.json()

      expect(response.statusCode).toBe(201)
      expect(body.message).toBe('Master bag created successfully.')
      expect(body.data).toMatchObject({
        id: expect.any(Number),
        code: payload.code,
        courierScheduleId: payload.courierScheduleId,
        sortingBatchId: payload.sortingBatchId,
        currentFacilityId: payload.currentFacilityId,
        nextFacilityId: payload.nextFacilityId,
        totalWeight: payload.totalWeight,
        totalParcels: payload.totalParcels,
        status: payload.status,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      })
    })

    test('a master bag can be updated', async () => {
      const createdBag = await createMasterBag(app)

      const updatePayload = {
        totalWeight: 4500,
        status: MasterBagStatus.Sealed,
      }

      const response = await app.inject({
        method: 'PUT',
        url: API_ROUTES.sortations.masterBag.update(createdBag.id),
        body: updatePayload
      })

      const body = response.json()

      expect(response.statusCode).toBe(200)
      expect(body.message).toBe('Master bag updated successfully.')
      expect(body.data).toMatchObject({
        id: createdBag.id,
        totalWeight: updatePayload.totalWeight,
        status: updatePayload.status,
      })
    })

    test('a master bag can be deleted', async () => {
      const createdBag = await createMasterBag(app)

      const response = await app.inject({
        method: 'DELETE',
        url: API_ROUTES.sortations.masterBag.delete(createdBag.id),
      })

      const body = response.json()

      expect(response.statusCode).toBe(200)
      expect(body.message).toBe('Master bag deleted successfully.')

      const deletedRecord = await app.prisma.masterBag.findUnique({
        where: { id: createdBag.id },
      })
      expect(deletedRecord).toBeNull()
    })
  })

  describe('Facility Chute Management', () => {
    let app: FastifyInstance

    beforeAll(() => {
      app = (globalThis as any).app as FastifyInstance
    })

    test('a facility chute can be created', async () => {
      const facility = await createFacility(app)
      const destinationFacility = await createFacility(app)

      const payload = {
        code: 'CHUTE-01',
        facilityId: facility.id,
        destinationFacilityId: destinationFacility.id,
        isActive: true,
      }

      const response = await app.inject({
        method: 'POST',
        url: API_ROUTES.sortations.facilityChute.store,
        body: payload
      })

      const body = response.json()

      expect(response.statusCode).toBe(201)
      expect(body.message).toBe('Facility chute created successfully.')
      expect(body.data).toMatchObject({
        id: expect.any(Number),
        code: payload.code,
        facilityId: payload.facilityId,
        destinationFacilityId: payload.destinationFacilityId,
        isActive: payload.isActive,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      })
    })

    test('a facility chute can be updated', async () => {
      const createdChute = await createFacilityChute(app)
      const updatePayload = {
        code: 'CHUTE-02-UPDATED',
        isActive: false,
      }

      const response = await app.inject({
        method: 'PUT',
        url: API_ROUTES.sortations.facilityChute.update(createdChute.id),
        body: updatePayload
      })

      const body = response.json()

      expect(response.statusCode).toBe(200)
      expect(body.message).toBe('Facility chute updated successfully.')
      expect(body.data).toMatchObject({
        id: createdChute.id,
        code: updatePayload.code,
        isActive: updatePayload.isActive,
      })
    })

    test('a facility chute can be deleted', async () => {
      const createdChute = await createFacilityChute(app)

      const response = await app.inject({
        method: 'DELETE',
        url: API_ROUTES.sortations.facilityChute.delete(createdChute.id),
      })

      const body = response.json()

      expect(response.statusCode).toBe(200)
      expect(body.message).toBe('Facility chute deleted successfully.')

      const deletedRecord = await app.prisma.facilityChute.findUnique({
        where: { id: createdChute.id },
      })
      expect(deletedRecord).toBeNull()
    })
  })
})