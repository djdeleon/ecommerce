import { beforeAll, describe, expect, test } from "vitest";
import { CourierStatus, FacilityType } from "@prisma/client";
import { createCourier, createFacility } from "#factory";
import { FastifyInstance } from "fastify";
import { PrismaClient } from "@prisma/client/extension";
import { API_ROUTES } from "#commons/constants/routes.js";

describe('Facilities Domain', () => {
  let app: FastifyInstance
  let prisma: PrismaClient

  beforeAll(async () => {
    app = (globalThis as any).testApp as FastifyInstance
    prisma = (globalThis as any).testApp as PrismaClient
  })

  const expectedKey = process.env.LOGISTICS_KEY

  test('an admin can view all facilities', async () => {
    await createFacility();

    await createCourier();
    await createCourier({
      status: CourierStatus.Offline
    });

    const response = await app.inject({
      method: 'GET',
      url: API_ROUTES.facilities.index,
      // headers: {
      //   authorization: `Bearer ${expectedKey}`
      // }
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().message).toBe('Facilities retrieved.')
    expect(response.json().data.facilities.length).toBe(1)
    expect(response.json().data.facilityTypes.length).toBe(3)
    expect(response.json().data.availableCouriers.length).toBe(1)
  })

  test('an admin can create a facility', async () => {
    const response = await app.inject({
      method: 'POST',
      url: API_ROUTES.facilities.store,
      // headers: {
      //   authorization: `Bearer ${expectedKey}`
      // },
      body: {
        name: "Marilao Mega Gateway",
        type: FacilityType.MegaGateway,
        address: "Marilao, Lias Road, ABC Main St.",
        longitude: 120.9542427,
        latitude: 14.7570638,
      }
    })

    expect(response.json().data.name).toBe("Marilao Mega Gateway")
  })

  test('a facility can have couriers', async () => {
    const facility = await createFacility();
    const facilityId = facility.id
    const courier = await createCourier();

    const response = await app.inject({
      method: 'PATCH',
      url: API_ROUTES.facilities.assignCourier(facilityId),
      headers: {
        authorization: `Bearer ${expectedKey}`
      },
      body: {
        courierId: courier.id
      }
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().data.couriers.length).toBe(1)
    expect(response.json().data.couriers[0].id).toBe(courier.id)
  })
})