import { API_ROUTES } from "#commons/constants/routes.js";
import { FastifyInstance } from "fastify";
import { beforeAll, describe, expect, test } from "vitest";
import { createClient } from "../factory/client.factory.js";

describe('Tracking Number Domain', () => {
  let app: FastifyInstance

  beforeAll(() => {
    app = (globalThis as any).app as FastifyInstance
  })

  test('a pool of tracking numbers can be allocated to a designated client', async () => {
    const client = await createClient()

    const response = await app.inject({
      method: 'POST',
      url: API_ROUTES.trackingNumbers.store,
      body: {
        clientId: client.id,
        size: 10,
      }
    })

    const trackingNumbers = response.json().data
    const trackingNumber = trackingNumbers[0]

    expect(response.statusCode).toBe(201)
    expect(trackingNumbers.length).toBe(10)
    expect(trackingNumber.trackingNumber).toMatch(/^FSTFY.*PH$/)
    expect(trackingNumber.clientId).toBe(client.id)
  })
})