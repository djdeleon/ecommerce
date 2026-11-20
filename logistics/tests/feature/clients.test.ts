import { FastifyInstance } from "fastify";
import { beforeAll, beforeEach, describe, expect, test } from "vitest";
import { clients } from "../../src/modules/clients/paths.js";
import { createClient } from "../factory/client.factory.js";
import { createUser } from "../factory/user.factory.js";
import { UserRole } from "@prisma/client";

describe('Clients Domain', () => {
  let app: FastifyInstance
  let adminToken: string

  beforeAll(async () => {
    app = (globalThis as any).app as FastifyInstance
  })

  beforeEach(async () => {
    const admin = await createUser(app, UserRole.Admin)
    adminToken = admin.token
  })

  const authHeaders = () => ({ authorization: `Bearer ${adminToken}` })

  test('an admin can view the client dashboard', async () => {
    const response = await app.inject({
      method: 'GET',
      url: clients.index,
      headers: authHeaders()
    })

    const clientList = response.json().data

    expect(response.statusCode).toBe(200)
    expect(Array.isArray(clientList)).toBe(true)
  })

  test('an admin can view the client dashboard with multiple clients', async () => {
    const createdClients = []
    for (let i = 1; i <= 10; i++) {
      const client = await createClient(app, { name: `Dashboard Client ${i}` })
      createdClients.push(client)
    }

    const response = await app.inject({
      method: 'GET',
      url: clients.index,
      headers: authHeaders()
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
    const response = await app.inject({
      method: 'POST',
      url: clients.store,
      headers: authHeaders(),
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
    const client = await createClient(app, { name: 'Viewable Client' })

    const response = await app.inject({
      method: 'GET',
      url: clients.show(client.id),
      headers: authHeaders()
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().data.id).toBe(client.id)
    expect(response.json().data.name).toBe('Viewable Client')
  })

  test('an admin can update a client', async () => {
    const client = await createClient(app)

    const response = await app.inject({
      method: 'PUT',
      url: clients.update(client.id),
      headers: authHeaders(),
      body: {
        name: 'Updated Store Name'
      }
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().data.name).toBe('Updated Store Name')
  })

  test('an admin can delete a client', async () => {
    const client = await createClient(app)

    const response = await app.inject({
      method: 'DELETE',
      url: clients.destroy(client.id),
      headers: authHeaders()
    })

    expect(response.statusCode).toBe(200)

    const deletedRecord = await app.prisma.client.findUnique({
      where: { id: client.id },
    })
    expect(deletedRecord).toBeNull()
  })
})