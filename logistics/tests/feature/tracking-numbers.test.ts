import { FastifyInstance } from "fastify";
import { beforeAll, describe, expect, test } from "vitest";
import { createClient } from "../factory/client.factory.js";
import { trackingNumbers } from "../../src/modules/tracking-numbers/paths.js";
import { activateTrackingNumber, generateTrackingNumbers } from "../../src/modules/tracking-numbers/service.js";

describe('Tracking Number Domain', () => {
  let app: FastifyInstance

  beforeAll(() => {
    app = (globalThis as any).app as FastifyInstance
  })

  test('can list all tracking numbers via index endpoint with correct structure', async () => {
    const client = await createClient(app)
    await generateTrackingNumbers({ apiKey: client.apiKey, size: 2 })

    const response = await app.inject({
      method: 'GET',
      url: trackingNumbers.index,
    })

    const json = response.json()

    expect(response.statusCode).toBe(200)
    expect(json).toHaveProperty('message', 'Tracking numbers retrieved successfully.')
    expect(Array.isArray(json.data)).toBe(true)
    expect(json.data.length).toBeGreaterThanOrEqual(2)

    const item = json.data[0]
    expect(item).toHaveProperty('id')
    expect(typeof item.id).toBe('number')
    expect(item).toHaveProperty('number')
    expect(item.number).toMatch(/^FSTFY.*PH$/)
    expect(item).toHaveProperty('isAssigned')
    expect(typeof item.isAssigned).toBe('boolean')

    expect(item).toHaveProperty('client')
    expect(item.client).toHaveProperty('id', client.id)
    expect(item.client).toHaveProperty('name', client.name)
    expect(item.client).toHaveProperty('apiKey', client.apiKey)
  })

  test('can retrieve a specific tracking number via show endpoint with correct structure', async () => {
    const client = await createClient(app)
    const pool = await generateTrackingNumbers({ apiKey: client.apiKey, size: 1 })
    const targetNumber = pool[0].number

    const response = await app.inject({
      method: 'GET',
      url: trackingNumbers.show(targetNumber),
    })

    const json = response.json()

    expect(response.statusCode).toBe(200)
    expect(json).toHaveProperty('message', 'Tracking number details retrieved successfully.')

    const data = json.data
    expect(data).toHaveProperty('id')
    expect(typeof data.id).toBe('number')
    expect(data).toHaveProperty('number', targetNumber)
    expect(data).toHaveProperty('clientId', client.id)
    expect(data).toHaveProperty('isAssigned', false)
    expect(data).toHaveProperty('assignedAt', null)
    expect(data).toHaveProperty('createdAt')
    expect(data).toHaveProperty('updatedAt')
  })

  test('a pool of tracking numbers can be allocated to a designated client', async () => {
    const client = await createClient(app)

    const response = await app.inject({
      method: 'POST',
      url: trackingNumbers.store,
      headers: {
        'x-api-key': client.apiKey,
      },
      body: {
        clientId: client.id,
        size: 10,
      }
    })

    const trackingNumberList = response.json().data
    const trackingNumber = trackingNumberList[0]

    expect(response.statusCode).toBe(201)
    expect(trackingNumberList.length).toBe(10)
    expect(trackingNumber.number).toMatch(/^FSTFY.*PH$/)
  })

  describe('a Tracking Number can be activated', () => {
    test('successfully activates an unassigned tracking number', async () => {
      const client = await createClient(app)

      // Generate one tracking number
      const pool = await generateTrackingNumbers({ apiKey: client.apiKey, size: 1 })
      const targetNumber = pool[0].number

      await expect(
        activateTrackingNumber(app, client.id, targetNumber)
      ).resolves.not.toThrow()

      const updated = await app.prisma.trackingNumber.findUnique({
        where: { number: targetNumber }
      })

      expect(updated?.isAssigned).toBe(true)
      expect(updated?.assignedAt).toBeInstanceOf(Date)
    })

    test('throws error if tracking number does not exist', async () => {
      const client = await createClient(app)

      await expect(
        activateTrackingNumber(app, client.id, 'FSTFYNONEXISTENTPH')
      ).rejects.toThrow('TrackingNumberDoesNotExist')
    })

    test('throws error if tracking number belongs to a different client', async () => {
      const clientA = await createClient(app)
      const clientB = await createClient(app)

      const pool = await generateTrackingNumbers({ apiKey: clientA.apiKey, size: 1 })
      const targetNumber = pool[0].number

      // Try activating clientA's tracking number using clientB's ID
      await expect(
        activateTrackingNumber(app, clientB.id, targetNumber)
      ).rejects.toThrow('TrackingNumberAndClientMismatched')
    })

    test('throws error if tracking number is already used', async () => {
      const client = await createClient(app)

      const pool = await generateTrackingNumbers({ apiKey: client.apiKey, size: 1 })
      const targetNumber = pool[0].number

      // First activation should succeed
      await activateTrackingNumber(app, client.id, targetNumber)

      // Second activation should fail
      await expect(
        activateTrackingNumber(app, client.id, targetNumber)
      ).rejects.toThrow('TrackingNumberIsAlreadyUsed')
    })
  })
})