import { API_ROUTES } from "#commons/constants/routes.js";
import { PrismaClient } from "@prisma/client/extension";
import { FastifyInstance } from "fastify";
import { beforeAll, describe, expect, test } from "vitest";

describe('Clients Domain', () => {
  let app: FastifyInstance
  let prisma: PrismaClient

  beforeAll(() => {
    app = (globalThis as any).testApp as FastifyInstance
    prisma = (globalThis as any).testPrisma as PrismaClient
  })

  test('an admin can view the client dashboard', async () => {
    const response = await app.inject({
      method: 'GET',
      url: API_ROUTES.clients.index
    })

    const clients = response.json().data

    expect(response.statusCode).toBe(200)
    expect(clients.length).toBe(0)
  })

  test('a client can register', async () => {
    const response = await app.inject({
      method: 'POST',
      url: API_ROUTES.clients.store,
      body: {
        name: 'Laravel E-Commerce PH',
      }
    })

    const client = response.json().data

    expect(response.statusCode).toBe(201)
    expect(client.name).toBe('Laravel E-Commerce PH')
    expect(client.apiKey).toBeTypeOf('string')
    expect(client.apiKey).contain('apk_')
    expect(client.apiSecret).toBeTypeOf('string')
    expect(client.webhookUrl).toBeTypeOf('string')
    expect(client.webhookUrl).contain('http://')
    expect(client.webhookSecret).toBeTypeOf('string')
  })
})