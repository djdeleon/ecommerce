import { beforeAll, describe, expect, test } from "vitest";
import { CourierStatus, FacilityType, UserRole } from "@prisma/client";
import { createCourier, createFacility } from "#factory";
import { FastifyInstance } from "fastify";
import { API_ROUTES } from "#commons/constants/routes.js";
import { createuser } from "../factory/user.factory.js";

describe('Facilities Domain', async () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = (globalThis as any).app as FastifyInstance
  })

  test('an admin can view facility dashboard', async () => {
    const admin = await createuser(UserRole.Admin)

    await createFacility();

    await createCourier();
    await createCourier({
      status: CourierStatus.Offline
    });

    const response = await app.inject({
      method: 'GET',
      url: API_ROUTES.facilities.index,
      headers: {
        authorization: `Bearer ${admin.token}`
      }
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().message).toBe('Facilities retrieved.')
    expect(response.json().data.facilities.length).toBe(1)
    expect(response.json().data.facilityTypes.length).toBe(3)
    expect(response.json().data.availableCouriers.length).toBe(1)
  })

  test('an admin can create a facility', async () => {
    const admin = await createuser(UserRole.Admin)

    const response = await app.inject({
      method: 'POST',
      url: API_ROUTES.facilities.store,
      headers: {
        authorization: `Bearer ${admin.token}`
      },
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
    const admin = await createuser(UserRole.Admin)

    const facility = await createFacility();
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

    expect(response.statusCode).toBe(200)
    expect(response.json().data.couriers.length).toBe(1)
    expect(response.json().data.couriers[0].id).toBe(courier.id)
  })
})