import { buildApp } from "./app.js";

import { describe, it, test, expect, beforeEach, afterAll } from "vitest";
import { prisma, disconnectPrisma } from "./prisma.js"
import { createFacility, createCourier, createParcel, createTrackingLog, createStore } from "./utils/factories.js";
import { CourierStatus, FacilityType, ShipmentStatus, UserRole } from "@prisma/client";
import { actAsCourier } from "./utils/auth-helpers.js";

beforeEach(async () => {
  await prisma.$connect();
  await prisma.parcel.deleteMany();
  await prisma.courier.deleteMany();
  await prisma.user.deleteMany();
  await prisma.facility.deleteMany();
});

afterAll(async () => {
  await disconnectPrisma()
});

describe('J&T Express Logistics', () => {
  const app = buildApp();
  const expectedKey = process.env.LOGISTICS_KEY;

  describe('Logistic Facilities', () => {
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

  describe('Logistic Couriers', () => {
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

  describe('Logistic Shipments', () => {
    test('a Laravel vendor can book a parcel', async () => {
      const store = await createStore()
      const courier = await createCourier();

      const response = await app.inject({
        method: 'POST',
        url: '/jnt/parcels',
        headers: {
          authorization: `Bearer ${expectedKey}`
        },
        body: {
          externalOrderId: "1",
          weightGrams: 1600,
          storeName: "Store ABC",
          storeContactNumber: "09542361264",
          storeAddress: "Manila, Bulan 123 St.",
          storeLocation: {lng: 14.21, lat: 123.24 },
          customerName: "John Customer",
          customerAddress: "Marilao San Pablo 123 St.",
          customerPhone: "09244562453",
        }
      })
      
      expect(response.statusCode).toBe(201)
      expect(await prisma.parcel.count()).toBe(1)

      expect(await prisma.trackingLog.count()).toBe(1)
      expect((await prisma.trackingLog.findFirstOrThrow()).parcelId).toBe(response.json().data.id)
    })

    test('a Laravel vendor can set the parcel to ready_for_pickup', async () => {
      const parcel = await createParcel()
      createTrackingLog(parcel.id)

      const response = await app.inject({
        method: 'PATCH',
        url: `/jnt/parcels/${parcel.externalOrderId}/ready-for-pickup`,
        headers: {
          authorization: `Bearer ${expectedKey}`
        },
      })

      expect(response.statusCode).toBe(200)
      expect(response.json().data.id).toBe(parcel.id)
      expect(response.json().data.status).toBe(ShipmentStatus.ReadyForPickup)

      const parcelTrackingLogs = await prisma.trackingLog.findMany({
        where: {
          parcelId: parcel.id
        }
      })

      expect(parcelTrackingLogs.length).toBe(2)
      expect(parcelTrackingLogs[0].status).toBe(ShipmentStatus.PendingPickup)
      expect(parcelTrackingLogs[1].status).toBe(ShipmentStatus.ReadyForPickup)
    })

    test('a ready_for_pickup parcel can be picked up by available courier wtih assigned facility with webhook dispatch', async () => {
      const parcel = await createParcel({
        externalOrderId: '1'
      })
      await createTrackingLog(parcel.id)
      await createTrackingLog(parcel.id, ShipmentStatus.ReadyForPickup)

      const courier = await createCourier({}, true)

      const authHeaders = await actAsCourier(app, courier.user)

      const response = await app.inject({
        method: 'PATCH',
        url: `/jnt/parcels/${parcel.id}/picked-up`,
        headers: authHeaders
      })

      expect(response.statusCode).toBe(200)
      expect(response.json().data.id).toBe(parcel.id)
      expect(response.json().data.status).toBe(ShipmentStatus.PickedUp)

      const parcelTrackingLogs = await prisma.trackingLog.findMany({
        where: {
          parcelId: parcel.id
        }
      })

      expect(parcelTrackingLogs.length).toBe(3)
      expect(parcelTrackingLogs[0].status).toBe(ShipmentStatus.PendingPickup)
      expect(parcelTrackingLogs[1].status).toBe(ShipmentStatus.ReadyForPickup)
      expect(parcelTrackingLogs[2].status).toBe(ShipmentStatus.PickedUp)
    })

    test('a picked_up parcel can be set to in_transit', async () => {
      const parcel = await createParcel()
      await createTrackingLog(parcel.id)
      await createTrackingLog(parcel.id, ShipmentStatus.ReadyForPickup)
      await createTrackingLog(parcel.id, ShipmentStatus.PickedUp)

      const courier = await createCourier({}, true)

      const authHeaders = await actAsCourier(app, courier.user)

      const response = await app.inject({
        method: 'PATCH',
        url: `/jnt/parcels/${parcel.id}/in-transit`,
        headers: authHeaders
      })

      expect(response.statusCode).toBe(200)
      expect(response.json().data.id).toBe(parcel.id)
      expect(response.json().data.status).toBe(ShipmentStatus.InTransit)

      const parcelTrackingLogs = await prisma.trackingLog.findMany({
        where: {
          parcelId: parcel.id
        }
      })

      expect(parcelTrackingLogs.length).toBe(4)
      expect(parcelTrackingLogs[0].status).toBe(ShipmentStatus.PendingPickup)
      expect(parcelTrackingLogs[1].status).toBe(ShipmentStatus.ReadyForPickup)
      expect(parcelTrackingLogs[2].status).toBe(ShipmentStatus.PickedUp)
      expect(parcelTrackingLogs[3].status).toBe(ShipmentStatus.InTransit)
    })

    test('an in_transit parcel can be set to arrived_at_hub', async () => {
      const parcel = await createParcel()
      await createTrackingLog(parcel.id)
      await createTrackingLog(parcel.id, ShipmentStatus.ReadyForPickup)
      await createTrackingLog(parcel.id, ShipmentStatus.PickedUp)
      await createTrackingLog(parcel.id, ShipmentStatus.InTransit)

      const courier = await createCourier({}, true)

      const authHeaders = await actAsCourier(app, courier.user)

      const response = await app.inject({
        method: 'PATCH',
        url: `/jnt/parcels/${parcel.id}/arrived-at-hub`,
        headers: authHeaders
      })

      expect(response.statusCode).toBe(200)
      expect(response.json().data.id).toBe(parcel.id)
      expect(response.json().data.status).toBe(ShipmentStatus.ArrivedAtHub)

      const parcelTrackingLogs = await prisma.trackingLog.findMany({
        where: {
          parcelId: parcel.id
        }
      })

      expect(parcelTrackingLogs.length).toBe(5)
      expect(parcelTrackingLogs[0].status).toBe(ShipmentStatus.PendingPickup)
      expect(parcelTrackingLogs[1].status).toBe(ShipmentStatus.ReadyForPickup)
      expect(parcelTrackingLogs[2].status).toBe(ShipmentStatus.PickedUp)
      expect(parcelTrackingLogs[3].status).toBe(ShipmentStatus.InTransit)
      expect(parcelTrackingLogs[4].status).toBe(ShipmentStatus.ArrivedAtHub)
    })

    test('an arrived_at_hub parcel can be set to out_for_delivery', async () => {
      const parcel = await createParcel()
      await createTrackingLog(parcel.id)
      await createTrackingLog(parcel.id, ShipmentStatus.ReadyForPickup)
      await createTrackingLog(parcel.id, ShipmentStatus.PickedUp)
      await createTrackingLog(parcel.id, ShipmentStatus.InTransit)
      await createTrackingLog(parcel.id, ShipmentStatus.ArrivedAtHub)

      const courier = await createCourier({}, true)

      const authHeaders = await actAsCourier(app, courier.user)

      const response = await app.inject({
        method: 'PATCH',
        url: `/jnt/parcels/${parcel.id}/out-for-delivery`,
        headers: authHeaders
      })

      expect(response.statusCode).toBe(200)
      expect(response.json().data.id).toBe(parcel.id)
      expect(response.json().data.status).toBe(ShipmentStatus.OutForDelivery)

      const parcelTrackingLogs = await prisma.trackingLog.findMany({
        where: {
          parcelId: parcel.id
        }
      })

      expect(parcelTrackingLogs.length).toBe(6)
      expect(parcelTrackingLogs[0].status).toBe(ShipmentStatus.PendingPickup)
      expect(parcelTrackingLogs[1].status).toBe(ShipmentStatus.ReadyForPickup)
      expect(parcelTrackingLogs[2].status).toBe(ShipmentStatus.PickedUp)
      expect(parcelTrackingLogs[3].status).toBe(ShipmentStatus.InTransit)
      expect(parcelTrackingLogs[4].status).toBe(ShipmentStatus.ArrivedAtHub)
      expect(parcelTrackingLogs[5].status).toBe(ShipmentStatus.OutForDelivery)
    })

    test('an out_for_delivery parcel can be set to delivered', async () => {
      const parcel = await createParcel()
      await createTrackingLog(parcel.id)
      await createTrackingLog(parcel.id, ShipmentStatus.ReadyForPickup)
      await createTrackingLog(parcel.id, ShipmentStatus.PickedUp)
      await createTrackingLog(parcel.id, ShipmentStatus.InTransit)
      await createTrackingLog(parcel.id, ShipmentStatus.ArrivedAtHub)
      await createTrackingLog(parcel.id, ShipmentStatus.OutForDelivery)

      const courier = await createCourier({}, true)

      const authHeaders = await actAsCourier(app, courier.user)

      const response = await app.inject({
        method: 'PATCH',
        url: `/jnt/parcels/${parcel.id}/delivered`,
        headers: authHeaders
      })

      expect(response.statusCode).toBe(200)
      expect(response.json().data.id).toBe(parcel.id)
      expect(response.json().data.status).toBe(ShipmentStatus.Delivered)

      const parcelTrackingLogs = await prisma.trackingLog.findMany({
        where: {
          parcelId: parcel.id
        }
      })

      expect(parcelTrackingLogs.length).toBe(7)
      expect(parcelTrackingLogs[0].status).toBe(ShipmentStatus.PendingPickup)
      expect(parcelTrackingLogs[1].status).toBe(ShipmentStatus.ReadyForPickup)
      expect(parcelTrackingLogs[2].status).toBe(ShipmentStatus.PickedUp)
      expect(parcelTrackingLogs[3].status).toBe(ShipmentStatus.InTransit)
      expect(parcelTrackingLogs[4].status).toBe(ShipmentStatus.ArrivedAtHub)
      expect(parcelTrackingLogs[5].status).toBe(ShipmentStatus.OutForDelivery)
      expect(parcelTrackingLogs[6].status).toBe(ShipmentStatus.Delivered)
    })

    test('a Laravel vendor can set the parcel to rejected', async () => {
      const parcel = await createParcel()
      createTrackingLog(parcel.id)

      const response = await app.inject({
        method: 'PATCH',
        url: `/jnt/parcels/${parcel.id}/rejected`,
        headers: {
          authorization: `Bearer ${expectedKey}`
        },
      })

      expect(response.statusCode).toBe(200)
      expect(response.json().data.id).toBe(parcel.id)
      expect(response.json().data.status).toBe(ShipmentStatus.Rejected)

      const parcelTrackingLogs = await prisma.trackingLog.findMany({
        where: {
          parcelId: parcel.id
        }
      })

      expect(parcelTrackingLogs.length).toBe(2)
      expect(parcelTrackingLogs[0].status).toBe(ShipmentStatus.PendingPickup)
      expect(parcelTrackingLogs[1].status).toBe(ShipmentStatus.Rejected)
    })

    test('a parcel can have a facility', async () => {
      const parcel = await createParcel()
      const facility = await createFacility()

      const response = await app.inject({
        method: 'PATCH',
        url: `/jnt/parcels/${parcel.id}/assign-facility`,
        headers: {
          authorization: `Bearer ${expectedKey}`
        },
        body: {
          facilityId: facility.id
        }
      })

      expect(response.statusCode).toBe(200)
      expect(response.json().data.id).toBe(parcel.id)
      expect(response.json().data.currentFacility.id).toBe(facility.id)
    })

    test('a parcel can have a courier', async () => {
      const parcel = await createParcel()
      const courier = await createCourier()

      const response = await app.inject({
        method: 'PATCH',
        url: `/jnt/parcels/${parcel.id}/assign-courier`,
        headers: {
          authorization: `Bearer ${expectedKey}`
        },
        body: {
          courierId: courier.id
        }
      })

      expect(response.statusCode).toBe(200)
      expect(response.json().data.id).toBe(parcel.id)
      expect(response.json().data.assignedCourier.id).toBe(courier.id)
    })
  })
})

describe('Logistics API - J&T Shipping Fee', () => {
  const app = buildApp();

  it('should return 401 if Authorization header is missing', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/jnt/shipping-fee',
      payload: {
        origin_zone: 'ncr',
        destination_zone: 'visayas',
        weight_kg: 2
      }
    })

    expect(response.statusCode).toBe(401);
  });

  it('should calculate shipping fee correctly when authenticated', async () => {
    const expectedKey = process.env.LOGISTICS_KEY;
    const response = await app.inject({
      method: 'POST',
      url: '/jnt/shipping-fee',
      headers: {
        authorization: `Bearer ${expectedKey}`
      },
      payload: {
        origin_zone: 'north_luzon',
        destination_zone: 'visayas',
        weight_kg: 2
      }
    })

    const { status, data } = response.json();

    expect(status).toBe(200);
    expect(data.shippingFee).toBe(85);
  })
})