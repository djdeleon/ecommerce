import { FastifyInstance } from "fastify";
import { beforeAll, describe, expect, test } from "vitest";
import { createClient } from "../factory/client.factory.js";
import { trackingNumbers } from "../../src/modules/tracking-numbers/paths.js";

describe('Tracking Number Domain', () => {
  let app: FastifyInstance

  beforeAll(() => {
    app = (globalThis as any).app as FastifyInstance
  })

  test('a pool of tracking numbers can be allocated to a designated client', async () => {
    const client = await createClient()

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
    expect(trackingNumber.trackingNumber).toMatch(/^FSTFY.*PH$/)
  })
})