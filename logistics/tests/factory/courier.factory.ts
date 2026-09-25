import { CourierStatus, UserRole } from "@prisma/client";
import { createFacility } from "./facility.factory.js";
import { PrismaClient } from "@prisma/client/extension";

export async function createCourier(overrides = {}, withNetwork = false) {
  const prisma = (globalThis as any).testPrisma as PrismaClient
  
  const randomSuffix = Math.floor(Math.random() * 10000);
  let facilityId = (overrides as any).currentFacilityId;

  if (!facilityId && withNetwork === true) {
    const facility = await createFacility();
    facilityId = facility.id;
  }

  const user = await prisma.user.create({
    data: {
      email: `user-${randomSuffix}@example.com`,
      password: 'secretPassword123',
      role: UserRole.Courier
    }
  })

  return await prisma.courier.create({
    data: {
      userId: user.id,
      firstName: "Fastification",
      lastName: "JavaScript",
      phoneNumber: `09${Math.floor(100000000 + Math.random() * 900000000)}`, // Random 11-digit string
      vehicleType: "truck",
      plateNumber: `ABC-${randomSuffix}`,
      status: CourierStatus.Available,
      currentFacilityId: facilityId,
      ...overrides,
    },
    include: {
      currentFacility: true,
      user: true
    }
  });
}
