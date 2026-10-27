import { beforeAll, describe, expect, test } from "vitest";
import { CourierStatus, UserRole } from "@prisma/client";
import { createCourier, createFacility } from "#factory";
import { FastifyInstance } from "fastify";
import { createUser } from "../factory/user.factory.js";
import { couriers } from "../../src/modules/couriers/paths.js";

describe('Couriers Domain', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = (globalThis as any).app as FastifyInstance
  })

  test('an admin can view courier dashboard', async () => {
    const admin = await createUser(app, UserRole.Admin)

    await createCourier(app);

    const response = await app.inject({
      method: 'GET',
      url: couriers.index,
      headers: {
        authorization: `Bearer ${admin.token}`
      }
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().message).toBe("Couriers retrieved.")
    expect(response.json().data.vehicleTypes.length).toBe(3)
    expect(response.json().data.couriers.length).toBe(1)
  })

  test('a courier can register', async () => {
    const facility = await createFacility(app);
    const payload = {
      email: "courier@example.com",
      password: "secretPassword123",
      firstName: "Courier First",
      lastName: "Courier Last",
      phoneNumber: '09756748574',
      vehicleType: "truck",
      status: CourierStatus.Available,
      assignedFacilityId: facility.id,
    }

    const response = await app.inject({
      method: 'POST',
      url: couriers.store,
      body: payload,
    })

    const body = response.json()

    expect(response.statusCode).toBe(201)
    expect(body.message).toBeDefined()
    expect(body.data.token).toEqual(expect.any(String))

    expect(body.data.courier).toMatchObject({
      id: expect.any(Number),
      userId: expect.any(Number),
      phoneNumber: payload.phoneNumber,
      vehicleType: payload.vehicleType,
      status: payload.status,
      user: {
        id: expect.any(Number),
        firstName: payload.firstName,
        lastName: payload.lastName,
        email: payload.email,
        role: UserRole.Courier,
      }
    })

    expect(await app.prisma.user.count()).toBe(1)
    expect(await app.prisma.courier.count()).toBe(1)
  })
})