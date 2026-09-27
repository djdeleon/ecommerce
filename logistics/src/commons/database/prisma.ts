import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import pg from "pg";

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL
})

const adapter = new PrismaPg(pool)

export const prisma = new PrismaClient({ adapter })

await prisma.$connect()

export async function disconnectDb() {
  await prisma.$disconnect()

  if (!pool.ended) {
    await pool.end()
  }
}