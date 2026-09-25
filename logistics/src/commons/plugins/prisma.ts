import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import { FastifyInstance } from 'fastify'
import fp from 'fastify-plugin'
import pg from 'pg'

export default fp(async function prismaPlugin(fastify: FastifyInstance) {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
  })

  const adapter = new PrismaPg(pool);

  const prisma = new PrismaClient({ adapter });

  await prisma.$connect()

  fastify.decorate('prisma', prisma)

  fastify.addHook('onClose', async (server) => {
    await server.prisma.$disconnect()

    if (!pool.ended) {
      await pool.end()
    }

    fastify.log.info('PostgreSQL Pool and Prismal Client disconnected successfully.')
  })
})