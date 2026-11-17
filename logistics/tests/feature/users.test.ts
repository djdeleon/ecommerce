import { FastifyInstance } from "fastify";
import { beforeAll, describe, expect, test } from "vitest";
import { UserRole } from "@prisma/client";
import { users } from "../../src/modules/users/paths.js";

describe('User HTTP Routes', () => {
  let app: FastifyInstance

  beforeAll(() => {
    app = (globalThis as any).app as FastifyInstance
  })

  test('admin can register', async () => {
    const randomSuffix = Math.floor(Math.random() * 10000);

    const response = await app.inject({
      method: 'POST',
      url: users.register,
      body: {
        firstName: 'Admin',
        lastName: 'User',
        email: `user-${randomSuffix}@example.com`,
        password: 'secretPassword123',
      }
    })

    expect(response.statusCode).toBe(201)

    const user = response.json().data.user
    const userCount = await app.prisma.user.count()

    expect(user.role).toBe(UserRole.Admin)
    expect(userCount).toBe(1)
    expect(response.json().user).not.toBeNull()
    expect(response.json().token).not.toBeNull()
  })

  test('a user trying to register with an email that already exists will receive an error', async () => {
    const randomSuffix = Math.floor(Math.random() * 10000);

    await app.inject({
      method: 'POST',
      url: users.register,
      body: {
        firstName: 'Admin',
        lastName: 'User',
        email: `user-${randomSuffix}@example.com`,
        password: 'secretPassword123',
        role: UserRole.Admin
      }
    })

    const [user] = await app.prisma.user.findMany()

    const response = await app.inject({
      method: 'POST',
      url: users.register,
      body: {
        firstName: 'Another',
        lastName: 'Admin',
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
      url: users.register,
      body: {
        firstName: 'Admin',
        lastName: 'User',
        email: `user-${randomSuffix}@example.com`,
        password: 'secretPassword123',
        role: UserRole.Admin
      }
    })

    expect(response.statusCode).toBe(201)
    const { user } = response.json().data

    const loginResponse = await app.inject({
      method: 'POST',
      url: users.login,
      body: {
        email: user.email,
        password: 'secretPassword123'
      }
    })

    expect(loginResponse.statusCode).toBe(200)
    expect(response.json().user).not.toBeNull()
    expect(response.json().token).not.toBeNull()
  })

  test('can list all users and filter by role or search', async () => {
    // Create a test user
    const user = await app.prisma.user.create({
      data: {
        firstName: 'QueryTest',
        lastName: 'User',
        email: `query-${Math.floor(Math.random() * 10000)}@example.com`,
        password: 'hashedPassword',
        role: UserRole.Manager,
      }
    })

    // Test list endpoint
    const response = await app.inject({
      method: 'GET',
      url: users.list,
      query: { role: 'Manager', search: 'QueryTest' }
    })

    expect(response.statusCode).toBe(200)
    const json = response.json()
    expect(json.data.length).toBeGreaterThan(0)
    expect(json.data[0].email).toBe(user.email)
  })

  test('can list all users and filter by role or search', async () => {
    // Create a test user
    const user = await app.prisma.user.create({
      data: {
        firstName: 'QueryTest',
        lastName: 'User',
        email: `query-${Math.floor(Math.random() * 10000)}@example.com`,
        password: 'hashedPassword',
        role: UserRole.Manager,
      }
    })

    // Test list endpoint
    const response = await app.inject({
      method: 'GET',
      url: users.list,
      query: { role: 'Manager', search: 'QueryTest' }
    })

    expect(response.statusCode).toBe(200)
    const json = response.json()
    expect(json.data.length).toBeGreaterThan(0)
    expect(json.data[0].email).toBe(user.email)
  })

  test('can filter users strictly by UserRole enum values (Admin, Manager, Clerk, Courier)', async () => {
    // Create users with different roles
    const managerEmail = `manager-${Math.floor(Math.random() * 10000)}@example.com`
    const courierEmail = `courier-${Math.floor(Math.random() * 10000)}@example.com`

    await app.prisma.user.createMany({
      data: [
        { firstName: 'Role', lastName: 'Manager', email: managerEmail, password: 'hashedPassword', role: UserRole.Manager },
        { firstName: 'Role', lastName: 'Courier', email: courierEmail, password: 'hashedPassword', role: UserRole.Courier },
      ]
    })

    // Filter by Manager role
    const response = await app.inject({
      method: 'GET',
      url: users.list,
      query: { role: UserRole.Manager }
    })

    expect(response.statusCode).toBe(200)
    const json = response.json()

    // Assert all returned users match the requested role
    expect(json.data.length).toBeGreaterThan(0)
    json.data.forEach((u: any) => {
      expect(u.role).toBe(UserRole.Manager)
    })
  })

  test('can get single user detail by id', async () => {
    const user = await app.prisma.user.create({
      data: {
        firstName: 'Detail',
        lastName: 'User',
        email: `detail-${Math.floor(Math.random() * 10000)}@example.com`,
        password: 'hashedPassword',
        role: UserRole.Clerk,
      }
    })

    const response = await app.inject({
      method: 'GET',
      url: users.detail(user.id),
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().data.id).toBe(user.id)
    expect(response.json().data.firstName).toBe('Detail')
  })

  test('can update an existing user', async () => {
    const user = await app.prisma.user.create({
      data: {
        firstName: 'OldName',
        lastName: 'User',
        email: `update-${Math.floor(Math.random() * 10000)}@example.com`,
        password: 'hashedPassword',
        role: UserRole.Clerk,
      }
    })

    const response = await app.inject({
      method: 'PUT',
      url: users.update(user.id),
      payload: {
        firstName: 'NewName'
      }
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().data.firstName).toBe('NewName')

    const dbUser = await app.prisma.user.findUnique({ where: { id: user.id } })
    expect(dbUser?.firstName).toBe('NewName')
  })

  test('can delete an existing user', async () => {
    const user = await app.prisma.user.create({
      data: {
        firstName: 'Delete',
        lastName: 'User',
        email: `delete-${Math.floor(Math.random() * 10000)}@example.com`,
        password: 'hashedPassword',
        role: UserRole.Courier,
      }
    })

    const response = await app.inject({
      method: 'DELETE',
      url: users.delete(user.id),
    })

    expect(response.statusCode).toBe(200)

    const dbUser = await app.prisma.user.findUnique({ where: { id: user.id } })
    expect(dbUser).toBeNull()
  })
})