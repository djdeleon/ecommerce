import { buildApp } from "./app.js";

import { describe, it, test, expect, beforeEach, afterAll } from "vitest";
import { prisma, disconnectPrisma } from "./prisma.js"
import { createNetwork, createCourier, createShipment } from "./utils/factories.js";
import { CourierStatus, NetworkType } from "@prisma/client";

beforeEach(async () => {
  await prisma.$connect();
  await prisma.shipment.deleteMany();
  await prisma.courier.deleteMany();
  await prisma.network.deleteMany();
});

afterAll(async () => {
  await disconnectPrisma()
});

describe('J&T Express Logistics', () => {
  const app = buildApp();
  const expectedKey = process.env.LOGISTICS_KEY;

  describe('Logistic Networks', () => {
    test('a J&T platform admin can view all networks', async () => {
      await createNetwork();

      await createCourier();
      await createCourier({
        status: CourierStatus.Offline
      });

      const response = await app.inject({
        method: 'GET',
        url: '/jnt/networks',
        headers: {
          authorization: `Bearer ${expectedKey}`
        }
      })

      expect(response.statusCode).toBe(200)
      expect(response.json().message).toBe('Networks retrieved.')
      expect(response.json().data.networks.length).toBe(1)
      expect(response.json().data.networkTypes.length).toBe(3)
      expect(response.json().data.availableCouriers.length).toBe(1)
    })

    test('a J&T platform admin can create a network', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/jnt/networks',
        headers: {
          authorization: `Bearer ${expectedKey}`
        },
        body: {
          name: "J&T Express Network Hub A",
          type: NetworkType.SortingHub,
          address: "Manila, Quezon City, Main St. 123",
        }
      })

      expect(response.json().data.name).toBe("J&T Express Network Hub A")
    })

    test('a network can have couriers', async () => {
      const network = await createNetwork();
      const networkId = network.id
      const courier = await createCourier();

      const response = await app.inject({
        method: 'PATCH',
        url: `/jnt/networks/${networkId}/assign-courier`,
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
    test('a J&T platform admin can create a network', async () => {
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
          firstName: "Courier First",
          lastName: "Courier Last",
          phoneNumber: `09${Math.floor(100000000 + Math.random() * 900000000)}`, // Random 11-digit string
          vehicleType: "truck",
          plateNumber: `ABC-${randomSuffix}`,
          status: CourierStatus.Available,
        }
      })

      expect(response.statusCode).toBe(201)
      expect(await prisma.courier.count()).toBe(1)
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