import { afterAll, beforeEach } from "vitest";
import { disconnectPrisma, prisma } from "../src/prisma.js";

beforeEach(async () => {
  await prisma.$connect();

  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE clients, tracking_number_pools, tracking_logs, parcels, couriers, users, delivery_boundaries, facilities, users CASCADE;
  `);
});

afterAll(async () => {
  await disconnectPrisma()
})
