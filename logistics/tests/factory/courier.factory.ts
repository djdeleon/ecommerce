import { CourierStatus } from "@prisma/client";
import { FastifyInstance } from "fastify";
import { registerCourier } from "../../src/modules/couriers/service.js";

export async function createCourier(fastify: FastifyInstance, overrides: any = {}) {
  const randomSuffix = Math.floor(Math.random() * 10000);

  const { userOverrides, ...courierOverride } = overrides

  const payload = {
    email: `courier-${randomSuffix}@example.com`,
    password: 'secretPassword123',
    phoneNumber: `09${Math.floor(100000000 + Math.random() * 900000000)}`,
    vehicleType: "truck",
    status: CourierStatus.Available,
    firstName: 'Test User',
    lastName: 'Test Last Name',
    ...overrides.userOverrides,
    ...courierOverride
  }

  return await registerCourier(fastify, payload)
}