import { FastifyInstance } from "fastify";
import { beforeAll, beforeEach, describe, expect, test } from "vitest";
import { createFacility } from "#factory";
import { createSector } from "../factory/sector.factory.js";
import { seedGeographicAreas } from "#commons/utils/spatial-seeder.js";
import { } from "node:test";
import { sectors } from "../../src/modules/sectors/paths.js";

describe('Sector Domain', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = (globalThis as any).app as FastifyInstance
  })

  beforeEach(async () => {
    await seedGeographicAreas(app.prisma);
  }, 60000)

  test('a sector can be created', async () => {
    const facility = await createFacility(app)

    const payload = {
      code: 'R03-BUL-SJD-01',
      localBranchId: facility.id,
      zone: {
        type: "Polygon",
        coordinates: [
          [
            [120.98, 14.75],
            [120.99, 14.75],
            [120.99, 14.76],
            [120.98, 14.76],
            [120.98, 14.75]
          ]
        ]
      }
    }

    const response = await app.inject({
      method: 'POST',
      url: sectors.store,
      body: payload
    })

    const body = response.json()

    expect(response.statusCode).toBe(201)
    expect(body.message).toBe('Sector created successfully.')
    expect(body.data).toMatchObject({
      id: expect.any(Number),
      code: payload.code,
      localBranchId: payload.localBranchId,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    })
  })

  test('a sector can be created with its barangays', async () => {
    const facility = await createFacility(app)

    const payload = {
      code: 'NCR-MET-MAR-S01', // based on the 3 segments of the code of its barangay
      localBranchId: facility.id,
      zone: {
        type: "Polygon",
        coordinates: [
          [
            [120.98, 14.75],
            [120.99, 14.75],
            [120.99, 14.76],
            [120.98, 14.76],
            [120.98, 14.75]
          ]
        ]
      },
      barangayIds: [
        "1381000001",
        "1381000002",
        "1381000003",
        "1381000004",
        "1381000005",
        "1381000006",
        "1381000007",
        "1381000008",
        "1381000009",
        "1381000010",
        "1381000011",
        "1381000012",
        "1381000013",
        "1381000014",
        "1381000015",
        "1381000016"
      ]
    }

    const response = await app.inject({
      method: 'POST',
      url: sectors.store,
      body: payload
    })

    const body = response.json()

    const sector = await app.prisma.sector.findUniqueOrThrow({
      where: { id: body.data.id },
      include: { barangays: true }
    })

    console.log(sector)

    expect(response.statusCode).toBe(201)
    expect(body.message).toBe('Sector created successfully.')
    expect(body.data).toMatchObject({
      id: expect.any(Number),
      code: payload.code,
      localBranchId: payload.localBranchId,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    })
    expect(sector.barangays.length).toBe(16)
  })

  test('a sector can be updated', async () => {
    const createdSector = await createSector(app)
    const updatePayload = {
      code: 'R03-BUL-SJD-02',
    }

    const response = await app.inject({
      method: 'PUT',
      url: sectors.update(createdSector.id),
      body: updatePayload
    })

    const body = response.json()

    expect(response.statusCode).toBe(200)
    expect(body.message).toBe('Sector updated successfully.')
    expect(body.data).toMatchObject({
      id: createdSector.id,
      code: updatePayload.code,
      localBranchId: createdSector.localBranchId,
    })
  })

  test('a sector can be deleted', async () => {
    const createdSector = await createSector(app)

    const response = await app.inject({
      method: 'DELETE',
      url: sectors.delete(createdSector.id),
    })

    const body = response.json()

    expect(response.statusCode).toBe(200)
    expect(body.message).toBe('Sector deleted successfully.')

    const deletedRecord = await app.prisma.sector.findUnique({
      where: { id: createdSector.id },
    })
    expect(deletedRecord).toBeNull()
  })
})