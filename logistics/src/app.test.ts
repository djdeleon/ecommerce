import { buildApp } from "./app.js";

import { describe, it, test, expect, beforeEach, afterAll } from "vitest";
import { prisma, disconnectPrisma } from "./prisma.js"
import { createNetwork, createCourier, createShipment } from "./utils/factories.js";
import { NetworkType } from "@prisma/client";

beforeEach(async () => {
    await prisma.$connect();
    await prisma.shipment.deleteMany();
    await prisma.courier.deleteMany();
    await prisma.network.deleteMany();
});

afterAll(async () => {
    await disconnectPrisma()
});

describe('Model Relationship Test', () => {
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

describe('Logistic Networks', () => {
    describe('J&T Express Logistics', () => {
        const app = buildApp();
        const expectedKey = process.env.LOGISTICS_KEY;

        test('a J&T platform admin can view all networks', async () => {
            await createNetwork();

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