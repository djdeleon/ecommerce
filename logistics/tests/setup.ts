import { afterAll, beforeAll, beforeEach } from "vitest";
import main from "../src/app.js";
import fastify from "fastify";
import { disconnectDb, prisma } from "#commons/database/prisma.js";

let app: any

beforeAll(async () => {
  app = fastify({ logger: false });
  await app.register(main);
  await app.ready();

  (globalThis as any).app = app;
});

beforeEach(async () => {
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE clients, tracking_number_pools, tracking_logs, parcels, couriers, users, delivery_boundaries, facilities, stores CASCADE;
  `);
});

afterAll(async () => {
  if (app) {
    await app.close();
  }

  await disconnectDb();
});