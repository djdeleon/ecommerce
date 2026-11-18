import { beforeAll, describe, expect, test } from "vitest";
import { CourierStatus, FacilityType, UserRole } from "@prisma/client";
import { createCourier, createFacility } from "#factory";
import { FastifyInstance } from "fastify";
import { createUser } from "../factory/user.factory.js";
import { facilityTypeMap } from "../../src/modules/facilities/facilityTypeMap.js";
import { facilities } from "../../src/modules/facilities/paths.js";

describe('Facilities Domain', async () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = (globalThis as any).app as FastifyInstance
  })

  test('an admin can view facility dashboard', async () => {
    const admin = await createUser(app, UserRole.Admin)
    const facility = await createFacility(app);
    await createCourier(app, { status: CourierStatus.Offline });

    const response = await app.inject({
      method: 'GET',
      url: facilities.index,
      headers: {
        authorization: `Bearer ${admin.token}`
      }
    })

    const body = response.json()
    const { facilities: facilityList, facilityTypes } = body.data

    expect(response.statusCode).toBe(200)
    expect(body.message).toBe('Facilities retrieved.')

    expect(facilityList).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: facility.id,
          name: facility.name,
          code: facility.code,
          address: facility.address,
        })
      ])
    )

    expect(facilityTypes).toEqual(
      expect.arrayContaining(['MegaGateway', 'DistributionCenter', 'LocalBranch'])
    )
  })

  test('an admin can create a facility', async () => {
    const admin = await createUser(app, UserRole.Admin)
    const payload = {
      name: "Marilao Mega Gateway",
      type: FacilityType.MegaGateway,
      address: "Marilao, Lias Road, ABC Main St.",
      longitude: 120.9542427,
      latitude: 14.7570638,
    }

    const response = await app.inject({
      method: 'POST',
      url: facilities.store,
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
    const admin = await createUser(app, UserRole.Admin)

    const facility = await createFacility(app);
    const facilityId = facility.id
    const { courier } = await createCourier(app);

    const response = await app.inject({
      method: 'PATCH',
      url: facilities.assignCourier(facilityId),
      headers: {
        authorization: `Bearer ${admin.token}`
      },
      body: {
        userId: courier.userId
      }
    })

    const body = response.json()

    expect(response.statusCode).toBe(200)
    expect(body.message).toBe('Courier assigned.')

    expect(body.data).toMatchObject({
      id: facility.id,
      name: facility.name,
      code: facility.code,
    })
  })

  test('an admin can view a single facility details', async () => {
    const admin = await createUser(app, UserRole.Admin)
    const facility = await createFacility(app)

    const response = await app.inject({
      method: 'GET',
      url: facilities.show(facility.id),
      headers: {
        authorization: `Bearer ${admin.token}`
      }
    })

    const body = response.json()

    expect(response.statusCode).toBe(200)
    expect(body.message).toBe('Facility Data retrieved successfully.')
    expect(body.data).toMatchObject({
      id: facility.id,
      name: facility.name,
      code: facility.code,
      address: facility.address
    })
  })

  test('an admin can update a facility', async () => {
    const admin = await createUser(app, UserRole.Admin)
    const facility = await createFacility(app)

    const updatePayload = {
      name: "Updated Mega Gateway",
      address: "New Address Line, City",
      type: FacilityType.DistributionCenter,
      longitude: 121.0000,
      latitude: 14.0000
    }

    const response = await app.inject({
      method: 'PUT',
      url: facilities.update(facility.id),
      headers: {
        authorization: `Bearer ${admin.token}`
      },
      body: updatePayload
    })

    const body = response.json()

    expect(response.statusCode).toBe(200)
    expect(body.message).toBe('Facility updated successfully.')
    expect(body.data).toMatchObject({
      id: facility.id,
      name: updatePayload.name,
      address: updatePayload.address,
      type: facilityTypeMap[updatePayload.type]
    })
  })

  test('an admin can delete a facility', async () => {
    const admin = await createUser(app, UserRole.Admin)
    const facility = await createFacility(app)

    const response = await app.inject({
      method: 'DELETE',
      url: facilities.delete(facility.id),
      headers: {
        authorization: `Bearer ${admin.token}`
      }
    })

    const body = response.json()

    expect(response.statusCode).toBe(200)
    expect(body.message).toBe('Facility deleted successfully.')

    // Verify it no longer exists
    const checkResponse = await app.inject({
      method: 'GET',
      url: facilities.show(facility.id),
      headers: {
        authorization: `Bearer ${admin.token}`
      }
    })
    expect(checkResponse.statusCode).toBe(500)
  })
})