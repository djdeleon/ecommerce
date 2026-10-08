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
  // 1. Leaf / Dependent child tables (no other tables depend on them)
  await prisma.trackingLog.deleteMany();
  await prisma.dispatchLog.deleteMany();
  await prisma.sectorCourier.deleteMany();
  
  // 2. Parcels and Master Bags (depend on courier schedules, sortation batches, clients, stores, facilities)
  await prisma.parcel.deleteMany();
  await prisma.masterBag.deleteMany();
  
  // 3. Operational batching and schedules (depend on courier, vehicles, network legs, facilities)
  await prisma.sortationBatch.deleteMany();
  await prisma.facilityChute.deleteMany();
  await prisma.courierSchedule.deleteMany();
  
  // 4. Vehicles & Network Legs (depend on vehicle profiles and facilities)
  await prisma.physicalVehicle.deleteMany();
  await prisma.networkLeg.deleteMany();
  
  // 5. Core entities with parent foreign keys
  await prisma.sector.deleteMany();
  await prisma.courier.deleteMany();
  await prisma.vehicleProfile.deleteMany();
  await prisma.trackingNumberPool.deleteMany();
  await prisma.store.deleteMany();
  
  // 6. Base parent tables (referenced by almost everything else)
  await prisma.client.deleteMany();
  await prisma.user.deleteMany();
  
  // 7. Root parent table
  await prisma.facility.deleteMany();
});

afterAll(async () => {
  if (app) {
    await app.close();
  }

  await disconnectDb();
});