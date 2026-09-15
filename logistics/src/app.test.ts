import { buildApp } from "./app.js";

import { describe, it, test, expect, beforeEach, afterAll } from "vitest";
import { prisma, disconnectPrisma } from "./prisma.js"
import { createNetwork, createCourier, createShipment, createTrackingLog } from "./utils/factories.js";
import { CourierStatus, NetworkType, ShipmentStatus } from "@prisma/client";
import { actAsCourier } from "./utils/auth-helpers.js";

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

  describe('Logistic Shipments', () => {
    test('a Laravel vendor can book a shipment', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/jnt/shipments',
        headers: {
          authorization: `Bearer ${expectedKey}`
        },
        body: {
          externalOrderId: "ORD-1",
          providerName: "jnt",
          senderName: "Jane Doe",
          senderPhoneNumber: "09245256362",
          senderAddress: "City of Dagupan, Pangasinan, Ilocos Region (Region I), Philippines",
          recipientName: "Johnny Doer",
          recipientPhoneNumber: "09245256542",
          recipientAddress: "City of Iloilo, Iloilo, Western Visayas (Region VI), Philippines",
          weightKg: 2,
          status: ShipmentStatus.PendingPickup,
        }
      })

      expect(response.statusCode).toBe(201)
      expect(await prisma.shipment.count()).toBe(1)

      expect(await prisma.trackingLog.count()).toBe(1)
      expect((await prisma.trackingLog.findFirstOrThrow()).shipmentId).toBe(response.json().data.id)
    })

    test('a Laravel vendor can set the shipment to ready_for_pickup', async () => {
      const shipment = await createShipment()
      createTrackingLog(shipment.id)

      const response = await app.inject({
        method: 'PATCH',
        url: `/jnt/shipments/${shipment.id}/ready-for-pickup`,
        headers: {
          authorization: `Bearer ${expectedKey}`
        },
      })

      expect(response.statusCode).toBe(200)
      expect(response.json().data.id).toBe(shipment.id)
      expect(response.json().data.status).toBe(ShipmentStatus.ReadyForPickup)

      const shipmentTrackingLogs = await prisma.trackingLog.findMany({
        where: {
          shipmentId: shipment.id
        }
      })

      expect(shipmentTrackingLogs.length).toBe(2)
      expect(shipmentTrackingLogs[0].status).toBe(ShipmentStatus.PendingPickup)
      expect(shipmentTrackingLogs[1].status).toBe(ShipmentStatus.ReadyForPickup)
    })

    test('a ready_for_pickup shipment can be picked up by available courier wtih assigned network', async () => {
      const shipment = await createShipment()
      await createTrackingLog(shipment.id)
      await createTrackingLog(shipment.id, ShipmentStatus.ReadyForPickup)

      const courier = await createCourier({}, true)

      const authHeaders = await actAsCourier(app, courier)

      const response = await app.inject({
        method: 'PATCH',
        url: `/jnt/shipments/${shipment.id}/picked-up`,
        headers: authHeaders
      })

      expect(response.statusCode).toBe(200)
      expect(response.json().data.id).toBe(shipment.id)
      expect(response.json().data.status).toBe(ShipmentStatus.PickedUp)

      const shipmentTrackingLogs = await prisma.trackingLog.findMany({
        where: {
          shipmentId: shipment.id
        }
      })

      expect(shipmentTrackingLogs.length).toBe(3)
      expect(shipmentTrackingLogs[0].status).toBe(ShipmentStatus.PendingPickup)
      expect(shipmentTrackingLogs[1].status).toBe(ShipmentStatus.ReadyForPickup)
      expect(shipmentTrackingLogs[2].status).toBe(ShipmentStatus.PickedUp)
    })

    test('a picked_up shipment can be set to in_transit', async () => {
      const shipment = await createShipment()
      await createTrackingLog(shipment.id)
      await createTrackingLog(shipment.id, ShipmentStatus.ReadyForPickup)
      await createTrackingLog(shipment.id, ShipmentStatus.PickedUp)

      const courier = await createCourier({}, true)

      const authHeaders = await actAsCourier(app, courier)

      const response = await app.inject({
        method: 'PATCH',
        url: `/jnt/shipments/${shipment.id}/in-transit`,
        headers: authHeaders
      })

      expect(response.statusCode).toBe(200)
      expect(response.json().data.id).toBe(shipment.id)
      expect(response.json().data.status).toBe(ShipmentStatus.InTransit)

      const shipmentTrackingLogs = await prisma.trackingLog.findMany({
        where: {
          shipmentId: shipment.id
        }
      })

      expect(shipmentTrackingLogs.length).toBe(4)
      expect(shipmentTrackingLogs[0].status).toBe(ShipmentStatus.PendingPickup)
      expect(shipmentTrackingLogs[1].status).toBe(ShipmentStatus.ReadyForPickup)
      expect(shipmentTrackingLogs[2].status).toBe(ShipmentStatus.PickedUp)
      expect(shipmentTrackingLogs[3].status).toBe(ShipmentStatus.InTransit)
    })

    test.only('an in_transit shipment can be set to arrived_at_hub', async () => {
      const shipment = await createShipment()
      await createTrackingLog(shipment.id)
      await createTrackingLog(shipment.id, ShipmentStatus.ReadyForPickup)
      await createTrackingLog(shipment.id, ShipmentStatus.PickedUp)
      await createTrackingLog(shipment.id, ShipmentStatus.InTransit)

      const courier = await createCourier({}, true)

      const authHeaders = await actAsCourier(app, courier)

      const response = await app.inject({
        method: 'PATCH',
        url: `/jnt/shipments/${shipment.id}/arrived-at-hub`,
        headers: authHeaders
      })

      expect(response.statusCode).toBe(200)
      expect(response.json().data.id).toBe(shipment.id)
      expect(response.json().data.status).toBe(ShipmentStatus.ArrivedAtHub)

      const shipmentTrackingLogs = await prisma.trackingLog.findMany({
        where: {
          shipmentId: shipment.id
        }
      })

      expect(shipmentTrackingLogs.length).toBe(5)
      expect(shipmentTrackingLogs[0].status).toBe(ShipmentStatus.PendingPickup)
      expect(shipmentTrackingLogs[1].status).toBe(ShipmentStatus.ReadyForPickup)
      expect(shipmentTrackingLogs[2].status).toBe(ShipmentStatus.PickedUp)
      expect(shipmentTrackingLogs[3].status).toBe(ShipmentStatus.InTransit)
      expect(shipmentTrackingLogs[4].status).toBe(ShipmentStatus.ArrivedAtHub)
    })

    test.only('an arrived_at_hub shipment can be set to out_for_delivery', async () => {
      const shipment = await createShipment()
      await createTrackingLog(shipment.id)
      await createTrackingLog(shipment.id, ShipmentStatus.ReadyForPickup)
      await createTrackingLog(shipment.id, ShipmentStatus.PickedUp)
      await createTrackingLog(shipment.id, ShipmentStatus.InTransit)
      await createTrackingLog(shipment.id, ShipmentStatus.ArrivedAtHub)

      const courier = await createCourier({}, true)

      const authHeaders = await actAsCourier(app, courier)

      const response = await app.inject({
        method: 'PATCH',
        url: `/jnt/shipments/${shipment.id}/out-for-delivery`,
        headers: authHeaders
      })

      expect(response.statusCode).toBe(200)
      expect(response.json().data.id).toBe(shipment.id)
      expect(response.json().data.status).toBe(ShipmentStatus.OutForDelivery)

      const shipmentTrackingLogs = await prisma.trackingLog.findMany({
        where: {
          shipmentId: shipment.id
        }
      })

      expect(shipmentTrackingLogs.length).toBe(6)
      expect(shipmentTrackingLogs[0].status).toBe(ShipmentStatus.PendingPickup)
      expect(shipmentTrackingLogs[1].status).toBe(ShipmentStatus.ReadyForPickup)
      expect(shipmentTrackingLogs[2].status).toBe(ShipmentStatus.PickedUp)
      expect(shipmentTrackingLogs[3].status).toBe(ShipmentStatus.InTransit)
      expect(shipmentTrackingLogs[4].status).toBe(ShipmentStatus.ArrivedAtHub)
      expect(shipmentTrackingLogs[5].status).toBe(ShipmentStatus.OutForDelivery)
    })

    test.only('an out_for_delivery shipment can be set to delivered', async () => {
      const shipment = await createShipment()
      await createTrackingLog(shipment.id)
      await createTrackingLog(shipment.id, ShipmentStatus.ReadyForPickup)
      await createTrackingLog(shipment.id, ShipmentStatus.PickedUp)
      await createTrackingLog(shipment.id, ShipmentStatus.InTransit)
      await createTrackingLog(shipment.id, ShipmentStatus.ArrivedAtHub)
      await createTrackingLog(shipment.id, ShipmentStatus.OutForDelivery)

      const courier = await createCourier({}, true)

      const authHeaders = await actAsCourier(app, courier)

      const response = await app.inject({
        method: 'PATCH',
        url: `/jnt/shipments/${shipment.id}/delivered`,
        headers: authHeaders
      })

      expect(response.statusCode).toBe(200)
      expect(response.json().data.id).toBe(shipment.id)
      expect(response.json().data.status).toBe(ShipmentStatus.Delivered)

      const shipmentTrackingLogs = await prisma.trackingLog.findMany({
        where: {
          shipmentId: shipment.id
        }
      })

      expect(shipmentTrackingLogs.length).toBe(7)
      expect(shipmentTrackingLogs[0].status).toBe(ShipmentStatus.PendingPickup)
      expect(shipmentTrackingLogs[1].status).toBe(ShipmentStatus.ReadyForPickup)
      expect(shipmentTrackingLogs[2].status).toBe(ShipmentStatus.PickedUp)
      expect(shipmentTrackingLogs[3].status).toBe(ShipmentStatus.InTransit)
      expect(shipmentTrackingLogs[4].status).toBe(ShipmentStatus.ArrivedAtHub)
      expect(shipmentTrackingLogs[5].status).toBe(ShipmentStatus.OutForDelivery)
      expect(shipmentTrackingLogs[6].status).toBe(ShipmentStatus.Delivered)
    })

    test('a Laravel vendor can set the shipment to rejected', async () => {
      const shipment = await createShipment()
      createTrackingLog(shipment.id)

      const response = await app.inject({
        method: 'PATCH',
        url: `/jnt/shipments/${shipment.id}/rejected`,
        headers: {
          authorization: `Bearer ${expectedKey}`
        },
      })

      expect(response.statusCode).toBe(200)
      expect(response.json().data.id).toBe(shipment.id)
      expect(response.json().data.status).toBe(ShipmentStatus.Rejected)

      const shipmentTrackingLogs = await prisma.trackingLog.findMany({
        where: {
          shipmentId: shipment.id
        }
      })

      expect(shipmentTrackingLogs.length).toBe(2)
      expect(shipmentTrackingLogs[0].status).toBe(ShipmentStatus.PendingPickup)
      expect(shipmentTrackingLogs[1].status).toBe(ShipmentStatus.Rejected)
    })

    test('a shipment can have a network', async () => {
      const shipment = await createShipment()
      const network = await createNetwork()

      const response = await app.inject({
        method: 'PATCH',
        url: `/jnt/shipments/${shipment.id}/assign-network`,
        headers: {
          authorization: `Bearer ${expectedKey}`
        },
        body: {
          networkId: network.id
        }
      })

      expect(response.statusCode).toBe(200)
      expect(response.json().data.id).toBe(shipment.id)
      expect(response.json().data.currentNetwork.id).toBe(network.id)
    })

    test('a shipment can have a courier', async () => {
      const shipment = await createShipment()
      const courier = await createCourier()

      const response = await app.inject({
        method: 'PATCH',
        url: `/jnt/shipments/${shipment.id}/assign-courier`,
        headers: {
          authorization: `Bearer ${expectedKey}`
        },
        body: {
          courierId: courier.id
        }
      })

      expect(response.statusCode).toBe(200)
      expect(response.json().data.id).toBe(shipment.id)
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