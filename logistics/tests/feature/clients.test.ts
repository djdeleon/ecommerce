import { FastifyInstance } from "fastify";
import { beforeAll, describe, expect, test } from "vitest";
import { clients } from "../../src/modules/clients/paths.js";
import { createClient } from "../factory/client.factory.js";
import { createUser } from "../factory/user.factory.js";
import { UserRole } from "@prisma/client";

describe('Clients Domain', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = (globalThis as any).app as FastifyInstance
  })

  test('an admin can view the client dashboard', async () => {
    const { token: adminToken } = await createUser(app, UserRole.Admin)

    const response = await app.inject({
      method: 'GET',
      url: clients.index,
      headers: {
        authorization: `Bearer ${adminToken}`
      }
    })

    const clientList = response.json().data

    expect(response.statusCode).toBe(200)
    expect(Array.isArray(clientList)).toBe(true)
  })

  test('an admin can view the client dashboard with multiple clients', async () => {
    const { token: adminToken } = await createUser(app, UserRole.Admin)

    const createdClients = []
    for (let i = 1; i <= 10; i++) {
      const client = await createClient(app, { name: `Dashboard Client ${i}` })
      createdClients.push(client)
    }

    const response = await app.inject({
      method: 'GET',
      url: clients.index,
      headers: {
        authorization: `Bearer ${adminToken}`
      }
    })

    const clientList = response.json().data

    expect(response.statusCode).toBe(200)
    expect(Array.isArray(clientList)).toBe(true)
    expect(clientList.length).toBeGreaterThanOrEqual(10)

    for (const seeded of createdClients) {
      const found = clientList.find((c: any) => c.id === seeded.id)
      expect(found).toBeTruthy()
      expect(found.name).toContain('Dashboard Client')
      expect(found.apiKey).toBeTypeOf('string')
    }
  })

  test('a client can register', async () => {
    const { token: adminToken } = await createUser(app, UserRole.Admin)

    const response = await app.inject({
      method: 'POST',
      url: clients.store,
      headers: {
        authorization: `Bearer ${adminToken}`
      },
      body: {
        name: 'Laravel E-Commerce PH',
      }
    })

    const client = response.json().data.client

    expect(response.statusCode).toBe(201)
    expect(client.name).toBe('Laravel E-Commerce PH')
    expect(client.apiKey).toBeTypeOf('string')
    expect(client.apiKey).contain('apk_')
    expect(client.apiSecret).toBeTypeOf('string')
    expect(client.webhookUrl).toBeTypeOf('string')
    expect(client.webhookUrl).contain('http://')
    expect(client.webhookSecret).toBeTypeOf('string')
  })

  test('an admin can view a client', async () => {
    const { token: adminToken } = await createUser(app, UserRole.Admin)

    const client = await createClient(app, { name: 'Viewable Client' })

    const response = await app.inject({
      method: 'GET',
      url: clients.show(client.id),
      headers: {
        authorization: `Bearer ${adminToken}`
      }
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().data.id).toBe(client.id)
    expect(response.json().data.name).toBe('Viewable Client')
  })

  test('an admin can update a client', async () => {
    const { token: adminToken } = await createUser(app, UserRole.Admin)

    const client = await createClient(app)

    const response = await app.inject({
      method: 'PUT',
      url: clients.update(client.id),
      headers: {
        authorization: `Bearer ${adminToken}`
      },
      body: {
        name: 'Updated Store Name'
      }
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().data.name).toBe('Updated Store Name')
  })

  test('an admin can delete a client', async () => {
    const { token: adminToken } = await createUser(app, UserRole.Admin)

    const client = await createClient(app)

    const response = await app.inject({
      method: 'DELETE',
      url: clients.destroy(client.id),
      headers: {
        authorization: `Bearer ${adminToken}`
      }
    })

    expect(response.statusCode).toBe(200)
  })
})