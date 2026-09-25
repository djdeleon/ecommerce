import { afterAll, beforeAll, beforeEach } from "vitest";
import main from "../src/app.js";
import fastify, { FastifyInstance } from "fastify";
import { PrismaClient } from "@prisma/client";
import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

let app: any
let testPrisma: PrismaClient
let testPool: pg.Pool

beforeAll(async () => {
  app = fastify()
  await app.register(main)
  await app.ready();
  (globalThis as any).testApp = app

  testPool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
  })

  const adapter = new PrismaPg(testPool)

  testPrisma = new PrismaClient({ adapter })
  await testPrisma.$connect();
  (globalThis as any).testPrisma = testPrisma
});

beforeEach(async () => {
  await testPrisma.$executeRawUnsafe(`
    TRUNCATE TABLE clients, tracking_number_pools, tracking_logs, parcels, couriers, users, delivery_boundaries, facilities, users CASCADE;
  `);
})

afterAll(async () => {
  await testPrisma.$disconnect()

  if (testPool && ! testPool.ended) {
    await testPool.end()
  }
  
  if (app) {
    await app.close()
  }
})
