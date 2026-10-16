import { CourierStatus, UserRole } from "@prisma/client";
import { createFacility } from "./facility.factory.js";
import { FastifyInstance } from "fastify";
import { createuser } from "./user.factory.js";

export async function createCourier(overrides = {}) {
  const app = (globalThis as any).app as FastifyInstance
  const randomSuffix = Math.floor(Math.random() * 10000);

  // 1. If assignedFacilityId is not provided in overrides, create a facility automatically
  let facilityId = (overrides as any).assignedFacilityId;
  if (!facilityId) {
    const facility = await createFacility(app);
    facilityId = facility.id;
  }

  // 2. A courier requires a user (UserRole.Courier)
  const { user } = await createuser(UserRole.Courier, {
    email: `courier-${randomSuffix}@example.com`,
    password: 'secretPassword123',
    ...(overrides as any).userOverrides,
  })

  // 3. Clean up temporary override helpers before spreading into prisma create
  const { userOverrides: _, assignedFacilityId: __, ...cleanOverrides } = overrides as any;

  // 4. Create the courier matching your exact schema fields
  return await app.prisma.courier.create({
    data: {
      userId: user.id,
      phoneNumber: `09${Math.floor(100000000 + Math.random() * 900000000)}`,
      vehicleType: "truck",
      plateNumber: `ABC-${randomSuffix}`,
      status: CourierStatus.Available,
      assignedFacilityId: facilityId,
      ...cleanOverrides,
    },
    include: {
      assignedFacility: true,
      user: true,
    }
  });
}