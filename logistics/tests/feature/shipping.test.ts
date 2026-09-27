import { describe, expect, it } from "vitest";
import { buildApp } from "../../src/app.js";

describe('Shipping Functionality', () => {
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