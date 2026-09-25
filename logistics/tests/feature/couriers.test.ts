import { beforeAll, describe, expect, test } from "vitest";
import { CourierStatus, PrismaClient } from "@prisma/client";
import { createCourier } from "#factory";
import { FastifyInstance } from "fastify";
import { API_ROUTES } from "#commons/constants/routes.js";

describe('Couriers Domain', () => {
  let app: FastifyInstance
  let prisma: PrismaClient

  beforeAll(async () => {
    app = (globalThis as any).testApp as FastifyInstance
    prisma = (globalThis as any).testPrisma as PrismaClient
  })

  const expectedKey = process.env.LOGISTICS_KEY


  test('an admin can create a facility', async () => {
    await createCourier();

    const response = await app.inject({
      method: 'GET',
      url: API_ROUTES.couriers.index,
      headers: {
        authorization: `Bearer ${expectedKey}`
      }
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().message).toBe("Couriers retrieved.")
    expect(response.json().data.vehicleTypes.length).toBe(3)
    expect(response.json().data.couriers.length).toBe(1)
  })

  test('a courier can register', async () => {
    const randomSuffix = Math.floor(Math.random() * 10000);

    const response = await app.inject({
      method: 'POST',
      url: API_ROUTES.couriers.store,
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