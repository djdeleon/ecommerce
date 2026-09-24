import { describe, expect, test } from "vitest";
import { CourierStatus, FacilityType } from "@prisma/client";
import { buildApp } from "../../src/app.js";
import { createCourier, createFacility } from "#factory";

describe('Facilities Domain', () => {
  const app = buildApp()
  const expectedKey = process.env.LOGISTICS_KEY

  test('a J&T platform admin can view all facilities', async () => {
    await createFacility();

    await createCourier();
    await createCourier({
      status: CourierStatus.Offline
    });

    const response = await app.inject({
      method: 'GET',
      url: '/jnt/facilities',
      headers: {
        authorization: `Bearer ${expectedKey}`
      }
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().message).toBe('Facilities retrieved.')
    expect(response.json().data.facilities.length).toBe(1)
    expect(response.json().data.facilityTypes.length).toBe(3)
    expect(response.json().data.availableCouriers.length).toBe(1)
  })

  test('a J&T platform admin can create a facility', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/jnt/facilities',
      headers: {
        authorization: `Bearer ${expectedKey}`
      },
      body: {
        name: "J&T Express Network Hub A",
        type: FacilityType.RegionalHub,
        address: "Manila, Quezon City, Main St. 123",
      }
    })

    expect(response.json().data.name).toBe("J&T Express Network Hub A")
  })

  test('a facility can have couriers', async () => {
    const facility = await createFacility();
    const facilityId = facility.id
    const courier = await createCourier();

    const response = await app.inject({
      method: 'PATCH',
      url: `/jnt/facilities/${facilityId}/assign-courier`,
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
