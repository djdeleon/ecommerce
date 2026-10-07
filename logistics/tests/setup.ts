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
  await prisma.trackingLog.deleteMany();
  await prisma.parcel.deleteMany();
  await prisma.trackingNumberPool.deleteMany();

  await prisma.store.deleteMany();
  await prisma.sector.deleteMany();
  await prisma.networkLeg.deleteMany();
  await prisma.physicalVehicle.deleteMany();
  await prisma.vehicleProfile.deleteMany();
  await prisma.facility.deleteMany();

  await prisma.client.deleteMany();
  await prisma.courier.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  if (app) {
    await app.close();
  }

  await disconnectDb();
});