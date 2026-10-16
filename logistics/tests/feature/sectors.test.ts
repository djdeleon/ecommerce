import { API_ROUTES } from "#commons/constants/routes.js";
import { FastifyInstance } from "fastify";
import { beforeAll, describe, expect, test } from "vitest";
import { createFacility } from "#factory";
import { createSector } from "../factory/sector.factory.js";

describe('Sector Domain', () => {
  let app: FastifyInstance

  beforeAll(() => {
    app = (globalThis as any).app as FastifyInstance
  })

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
      url: API_ROUTES.sectors.store,
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

  test('a sector can be updated', async () => {
    const createdSector = await createSector(app)
    const updatePayload = {
      code: 'R03-BUL-SJD-02',
    }

    const response = await app.inject({
      method: 'PUT',
      url: API_ROUTES.sectors.update(createdSector.id),
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
      url: API_ROUTES.sectors.delete(createdSector.id),
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