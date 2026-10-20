import { UserRole } from "@prisma/client";
import { registerUser } from "../../src/modules/users/service.js";
import { FastifyInstance } from "fastify";
import { createFacility } from "./facility.factory.js";

export async function createuser(fastify: FastifyInstance, role: UserRole, overrides = {}) {
  const randomSuffix = Math.floor(Math.random() * 10000);

  let assignedFacilityId = (overrides as any)?.assignedFacilityId;
  if (!assignedFacilityId) {
    const facility = await createFacility(fastify);
    assignedFacilityId = facility.id;
  }

  return await registerUser(fastify, {
    firstName: 'Test',
    lastName: 'User',
    email: `user-${randomSuffix}@example.com`,
    password: 'secretPassword123',
    role,
    assignedFacilityId,
    ...overrides,
  })
}