import { UserRole } from "@prisma/client";
import { registerUser } from "../../src/modules/users/service.js";
import { FastifyInstance } from "fastify";

export async function createuser(role: UserRole) {
  const app = (globalThis as any).app as FastifyInstance
  const randomSuffix = Math.floor(Math.random() * 10000);

  return await registerUser(app, {
    email: `user-${randomSuffix}@example.com`,
    password: 'secretPassword123',
    role
  })
}