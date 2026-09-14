import { buildApp } from "./app.js";

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma, disconnectPrisma } from "./prisma.js"
import { createNetwork, createCourier, createShipment } from "./utils/factories.js";

describe('Model Relationship Test', () => {
  beforeAll(async () => {
    await prisma.$connect();
    await prisma.shipment.deleteMany();
    await prisma.courier.deleteMany();
    await prisma.network.deleteMany();
  });

  afterAll(async () => {
    await disconnectPrisma()
  });

  it('creates a network', async () => {
    const network = await createNetwork({
        name: "Network A"
    });

    const courier = await createCourier({
        firstName: "Fastification"
    });

    const shipment = await createShipment({
        providerName: "Ninja Van"
    });

    const networkCourier = await prisma.network.findUnique({
        where: { id: courier.currentNetwork.id },
        include: {
            _count: {
                select: {
                    couriers: true
                }
            }
        }
    });

    expect(await prisma.network.count()).toBe(3)
    expect(await prisma.courier.count()).toBe(2)
    expect(await prisma.shipment.count()).toBe(1)
    expect(network.name).toBe("Network A")
    expect(courier.firstName).toBe("Fastification")
    expect(shipment.providerName).toBe("Ninja Van")
    expect(networkCourier?._count.couriers).toBe(1)
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