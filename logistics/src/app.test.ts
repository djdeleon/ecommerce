import { buildApp } from "./app.js";

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma, disconnectPrisma } from "./prisma.js"

describe('Database Test', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await disconnectPrisma()
  });

  it('should create a shipment', async () => {
    const shipment = await prisma.shipments.create({
      data: {
        trackingNumber: `Test-${Date.now()}`,
        barcode: "123",
        originZone: "ncr",
        destinationZone: "visayas"
      }
    });

    console.dir(shipment);
    expect(shipment.id).toBeDefined();
    await prisma.shipments.delete({ where: { id: shipment.id } });
  });
});


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