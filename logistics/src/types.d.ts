import { PrismaClient } from "@prisma/client";

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient
  }
}

export type AuthenticatedUser = Prisma.UserGetPayload<{
  include: { courier: true };
}>;

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { id: number };
    user: AuthenticatedUser;
  }
}