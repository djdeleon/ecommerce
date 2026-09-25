import { FastifyInstance } from "fastify";
import { beforeAll, describe, expect, test } from "vitest";
import { PrismaClient, UserRole } from "@prisma/client";
import { API_ROUTES } from "../../src/commons/constants/routes.js";

describe('User HTTP Routes', () => {
  let app: FastifyInstance
  let prisma: PrismaClient

  beforeAll(() => {
    app = (globalThis as any).testApp as FastifyInstance
    prisma = (globalThis as any).testPrisma as PrismaClient
  })

  test('admin can register', async () => {
    const randomSuffix = Math.floor(Math.random() * 10000);

    const response = await app.inject({
      method: 'POST',
      url: API_ROUTES.users.register,
      payload: {
        email: `user-${randomSuffix}@example.com`,
        password: 'secretPassword123',
        role: UserRole.Admin
      }
    })

    expect(response.statusCode).toBe(201)

    const user = response.json().data.user
    const userCount = await prisma.user.count()

    expect(user.role).toBe(UserRole.Admin)
    expect(userCount).toBe(1)
    expect(response.json().user).not.toBeNull()
    expect(response.json().token).not.toBeNull()
  })

  test('a user trying to register with an email that already exists will receive an error', async () => {
    const randomSuffix = Math.floor(Math.random() * 10000);

    await app.inject({
      method: 'POST',
      url: API_ROUTES.users.register,
      payload: {
        email: `user-${randomSuffix}@example.com`,
        password: 'secretPassword123',
        role: UserRole.Admin
      }
    })

    const [user] = await prisma.user.findMany()

    const response = await app.inject({
      method: 'POST',
      url: API_ROUTES.users.register,
      payload: {
        email: user.email,
        password: 'secretPassword123',
        role: UserRole.Admin
      }
    })

    expect(response.statusCode).toBe(400)
    expect(response.json().error).toBe("Email already registered.")
  })

  test('a user can login', async () => {
    const randomSuffix = Math.floor(Math.random() * 10000);

    const response = await app.inject({
      method: 'POST',
      url: API_ROUTES.users.register,
      body: {
        email: `user-${randomSuffix}@example.com`,
        password: 'secretPassword123',
        role: UserRole.Admin
      }
    })

    expect(response.statusCode).toBe(201)
    const { user } = response.json().data

    const loginResponse = await app.inject({
      method: 'POST',
      url: API_ROUTES.users.login,
      body: {
        email: user.email,
        password: 'secretPassword123'
      }
    })

    expect(loginResponse.statusCode).toBe(200)
    expect(response.json().user).not.toBeNull()
    expect(response.json().token).not.toBeNull()
  })
})