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
    TRUNCATE TABLE 
      tracking_logs,
      dispatch_logs,
      vehicle_location_logs,
      parcels,
      master_bags,
      manifests,
      deliveries,
      sortation_batches,
      courier_schedules,
      physical_vehicles,
      network_legs,
      barangays,
      cities,
      provinces,
      regions,
      sectors,
      couriers,
      vehicle_profiles,
      tracking_number_pools,
      stores,
      clients,
      users,
      facility_schedules,
      facilities
    RESTART IDENTITY CASCADE;
  `);
});

afterAll(async () => {
  if (app) {
    await app.close();
  }

  await disconnectDb();
});