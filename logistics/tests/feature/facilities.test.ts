import { beforeAll, describe, expect, test } from "vitest";
import { CourierStatus, FacilityType, UserRole } from "@prisma/client";
import { createCourier, createFacility } from "#factory";
import { FastifyInstance } from "fastify";
import { API_ROUTES } from "#commons/constants/routes.js";
import { createuser } from "../factory/user.factory.js";
import { facilityTypeMap } from "../../src/modules/facilities/facilityTypeMap.js";

describe('Facilities Domain', async () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = (globalThis as any).app as FastifyInstance
  })

  test('an admin can view facility dashboard', async () => {
    const admin = await createuser(UserRole.Admin)
    const facility = await createFacility(app);
    const availableCourier = await createCourier();
    await createCourier({ status: CourierStatus.Offline });

    const response = await app.inject({
      method: 'GET',
      url: API_ROUTES.facilities.index,
      headers: {
        authorization: `Bearer ${admin.token}`
      }
    })

    const body = response.json()

    expect(response.statusCode).toBe(200)
    expect(body.message).toBe('Facilities retrieved.')

    expect(body.data.facilities).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: facility.id,
          name: facility.name,
          code: facility.code,
          address: facility.address,
        })
      ])
    )

    expect(body.data.facilityTypes).toEqual([
      'MegaGateway',
      'DistributionCenter',
      'LocalBranch',
    ])

    expect(body.data.availableCouriers.length).toBe(1)
    expect(body.data.availableCouriers[0]).toMatchObject({
      id: availableCourier.id,
      status: CourierStatus.Available,
    })
  })

  test('an admin can create a facility', async () => {
    const admin = await createuser(UserRole.Admin)
    const payload = {
      name: "Marilao Mega Gateway",
      type: FacilityType.MegaGateway,
      address: "Marilao, Lias Road, ABC Main St.",
      longitude: 120.9542427,
      latitude: 14.7570638,
    }

    const response = await app.inject({
      method: 'POST',
      url: API_ROUTES.facilities.store,
      headers: {
        authorization: `Bearer ${admin.token}`
      },
      body: payload
    })

    const body = response.json()

    expect(response.statusCode).toBe(201)
    expect(body.message).toBeDefined()
    expect(body.data).toMatchObject({
      id: expect.any(Number),
      name: payload.name,
      code: expect.any(String),
      type: facilityTypeMap[payload.type],
      address: payload.address,
    })
  })

  test('a facility can have couriers', async () => {
    const admin = await createuser(UserRole.Admin)

    const facility = await createFacility(app);
    const facilityId = facility.id
    const courier = await createCourier();

    const response = await app.inject({
      method: 'PATCH',
      url: API_ROUTES.facilities.assignCourier(facilityId),
      headers: {
        authorization: `Bearer ${admin.token}`
      },
      body: {
        courierId: courier.id
      }
    })

    const body = response.json()

    expect(response.statusCode).toBe(200)
    expect(body.message).toBe('Courier assigned.')
    expect(body.data).toMatchObject({
      id: facilityId,
      name: facility.name,
      code: facility.code,
    })
    expect(body.data.couriers).toHaveLength(1)
    expect(body.data.couriers[0]).toMatchObject({
      id: courier.id,
      plateNumber: courier.plateNumber,
      status: courier.status,
    })
  })
})