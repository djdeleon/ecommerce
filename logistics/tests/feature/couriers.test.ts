import { describe, expect, test } from "vitest";
import { buildApp } from "../../src/app.js"
import { prisma } from "../../src/prisma.js";
import { CourierStatus, UserRole } from "@prisma/client";
import { createCourier } from "#factory";

describe('Couriers & Auth Domain', () => {
  const app = buildApp()
  const expectedKey = process.env.LOGISTICS_KEY

  test('admin can register', async () => {
    const randomSuffix = Math.floor(Math.random() * 10000);

    const response = await app.inject({
      method: 'POST',
      url: '/jnt/users/register',
      body: {
        email: `user-${randomSuffix}@example.com`,
        password: 'secretPassword123',
        role: UserRole.Admin
      }
    })

    expect(response.statusCode).toBe(201)
    expect(await prisma.user.count()).toBe(1)
    expect(response.json().user).not.toBeNull()
    expect(response.json().token).not.toBeNull()
  })

  test('a user can login', async () => {
    const randomSuffix = Math.floor(Math.random() * 10000);

    const response = await app.inject({
      method: 'POST',
      url: '/jnt/users/register',
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
      url: '/jnt/users/login',
      body: {
        email: user.email,
        password: 'secretPassword123'
      }
    })

    expect(loginResponse.statusCode).toBe(200)
    expect(response.json().user).not.toBeNull()
    expect(response.json().token).not.toBeNull()
  })

  test('a J&T platform admin can create a facility', async () => {
    await createCourier();

    const response = await app.inject({
      method: 'GET',
      url: '/jnt/couriers',
      headers: {
        authorization: `Bearer ${expectedKey}`
      }
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().message).toBe("Couriers retrieved.")
    expect(response.json().data.vehicleType.length).toBe(3)
    expect(response.json().data.couriers.length).toBe(1)
  })
  
  test('a courier can register', async () => {
    const randomSuffix = Math.floor(Math.random() * 10000);

    const response = await app.inject({
      method: 'POST',
      url: '/jnt/couriers',
      headers: {
        authorization: `Bearer ${expectedKey}`
      },
      body: {
        email: `courier-${randomSuffix}@example.com`,
        password: 'secretPassword123',
        firstName: "Courier First",
        lastName: "Courier Last",
        phoneNumber: `09${Math.floor(100000000 + Math.random() * 900000000)}`, // Random 11-digit string
        vehicleType: "truck",
        plateNumber: `ABC-${randomSuffix}`,
        status: CourierStatus.Available,
      }
    })

    expect(response.statusCode).toBe(201)
    expect(await prisma.user.count()).toBe(1)
    expect(await prisma.courier.count()).toBe(1)
  })
})