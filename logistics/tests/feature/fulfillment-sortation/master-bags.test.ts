import { createFacility, createParcel } from "#factory"
import { UserRole, SortingBatchStatus, MasterBagStatus, ShipmentStatus } from "@prisma/client"
import { FastifyInstance } from "fastify"
import { describe, beforeAll, test, expect } from "vitest"
import { masterBags } from "../../../src/modules/fulfillment-sortation/paths/master-bag.path.js"
import { createFleetTransport } from "../../factory/fleet-transport.factory.js"
import { createUser } from "../../factory/user.factory.js"
import { createMasterBag } from "../../factory/master-bag.factory.js"
import { createSortingBatch } from "../../factory/sorting-batch.factory.js"

describe('Master Bag Management', () => {
  let app: FastifyInstance

  beforeAll(() => {
    app = (globalThis as any).app as FastifyInstance
  })

  test('master bags can be listed', async () => {
    const { token } = await createUser(app, UserRole.Manager)
    await createMasterBag(app)

    const response = await app.inject({
      method: 'GET',
      url: masterBags.index,
      headers: {
        authorization: `Bearer ${token}`
      }
    })

    const body = response.json()

    expect(response.statusCode).toBe(200)
    expect(body.message).toBe('Master bags retrieved successfully.')
    expect(Array.isArray(body.data)).toBe(true)
    expect(body.data.length).toBeGreaterThan(0)
    expect(body.data[0]).toMatchObject({
      id: expect.any(Number),
      code: expect.any(String),
      sortingBatchId: expect.any(Number),
      currentFacilityId: expect.any(Number),
      nextFacilityId: expect.any(Number),
      status: expect.any(String),
      currentFacility: expect.any(Object),
      nextFacility: expect.any(Object),
      sortingBatch: expect.any(Object),
      parcels: expect.any(Array),
    })
  })

  test('a master bag can be created', async () => {
    const { token } = await createUser(app, UserRole.Manager)

    const facilityCurrent = await createFacility(app)
    const facilityNext = await createFacility(app)
    const courierSchedule = await createFleetTransport(app)

    const sortingBatch = await app.prisma.sortingBatch.create({
      data: {
        code: 'BATCH-BAG-001',
        facilityId: facilityCurrent.id,
        status: SortingBatchStatus.Active,
        cutOffTime: new Date("1970-01-01T21:00:00Z"),
      }
    })

    const payload = {
      courierScheduleId: courierSchedule.id,
      sortingBatchId: sortingBatch.id,
      currentFacilityId: facilityCurrent.id,
      nextFacilityId: facilityNext.id,
      totalWeight: 5000,
      totalCbm: 5,
      totalParcels: 10,
      status: MasterBagStatus.Open,
    }

    const response = await app.inject({
      method: 'POST',
      url: masterBags.store,
      headers: {
        authorization: `Bearer ${token}`
      },
      body: payload
    })

    const body = response.json()
    expect(response.statusCode).toBe(201)
    expect(body.message).toBe('Master bag created successfully.')
    expect(body.data).toMatchObject({
      id: expect.any(Number),
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

  test('a master bag can be retrieved by id', async () => {
    const { token } = await createUser(app, UserRole.Manager)
    const createdBag = await createMasterBag(app)

    const response = await app.inject({
      method: 'GET',
      url: masterBags.show(createdBag.id),
      headers: {
        authorization: `Bearer ${token}`
      }
    })

    const body = response.json()

    expect(response.statusCode).toBe(200)
    expect(body.message).toBe('Master bag retrieved successfully.')
    expect(body.data).toMatchObject({
      id: createdBag.id,
      code: createdBag.code,
      sortingBatchId: createdBag.sortingBatchId,
      currentFacilityId: createdBag.currentFacilityId,
      nextFacilityId: createdBag.nextFacilityId,
      status: createdBag.status,
      currentFacility: expect.any(Object),
      nextFacility: expect.any(Object),
      sortingBatch: expect.any(Object),
      parcels: expect.any(Array),
      logs: expect.any(Array),
    })
  })

  test('a master bag label can be printed', async () => {
    const { token } = await createUser(app, UserRole.Manager)

    const originFacility = await createFacility(app, { name: 'Manila Gateway' });
    const nextFacility = await createFacility(app, { name: 'Cebu Hub' });

    const batch = await createSortingBatch(app, {
      facilityId: originFacility.id,
      code: 'BATCH-NIGHT-001',
      status: SortingBatchStatus.Active
    });

    const schedule = await createFleetTransport(app);

    const masterBag = await createMasterBag(app, {
      code: 'GW-MNL-01-20261023-BAG-001',
      currentFacilityId: originFacility.id,
      nextFacilityId: nextFacility.id,
      sortingBatchId: batch.id,
      courierScheduleId: schedule.id,
      status: MasterBagStatus.Open
    });

    const response = await app.inject({
      method: 'GET',
      url: masterBags.label(masterBag.code),
      headers: {
        authorization: `Bearer ${token}`
      },
    });

    const htmlBody = response.body;

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toContain('text/html');

    expect(htmlBody).toContain(masterBag.code);
    expect(htmlBody).toContain('Manila Gateway');
    expect(htmlBody).toContain('Cebu Hub');
    expect(htmlBody).toContain('BATCH-NIGHT-001');
    expect(htmlBody).toContain('<svg'); // Ensures the barcode is an SVG vector
  });

  test('a master bag can be updated', async () => {
    const { token } = await createUser(app, UserRole.Manager)

    const createdBag = await createMasterBag(app)

    const updatePayload = {
      totalWeight: 4500,
      status: MasterBagStatus.Sealed,
    }

    const response = await app.inject({
      method: 'PUT',
      url: masterBags.update(createdBag.id),
      headers: {
        authorization: `Bearer ${token}`
      },
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
    const { token } = await createUser(app, UserRole.Manager)

    const createdBag = await createMasterBag(app)

    const response = await app.inject({
      method: 'DELETE',
      url: masterBags.delete(createdBag.id),
      headers: {
        authorization: `Bearer ${token}`
      }
    })

    const body = response.json()

    expect(response.statusCode).toBe(200)
    expect(body.message).toBe('Master bag deleted successfully.')

    const deletedRecord = await app.prisma.masterBag.findUnique({
      where: { id: createdBag.id },
    })
    expect(deletedRecord).toBeNull()
  })

  test('a master bag can be sealed', async () => {
    const { token } = await createUser(app, UserRole.Manager)

    const parcel = await createParcel(app, {
      weightGrams: 2000,
      lengthCm: 30,
      widthCm: 20,
      heightCm: 10,
      status: ShipmentStatus.Sorting,
    });
    const masterBag = await createMasterBag(app)

    const response = await app.inject({
      method: 'PATCH',
      url: masterBags.seal(masterBag.code),
      headers: {
        authorization: `Bearer ${token}`
      }
    })

    const body = response.json();
    const data = body.data ?? body;

    expect(response.statusCode).toBe(200);
    expect(body.message).toBe('Master bag is sealed successfully.');
    expect(data?.code).toBe(masterBag.code);
    expect(data?.status).toBe(MasterBagStatus.Sealed);
  })
})