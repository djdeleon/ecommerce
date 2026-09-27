import { disconnectDb, prisma } from '#commons/database/prisma.js'
import { FastifyInstance } from 'fastify'
import fp from 'fastify-plugin'

export default fp(async function prismaPlugin(fastify: FastifyInstance) {
  if (!fastify.hasDecorator('prisma')) {
    fastify.decorate('prisma', prisma)
  }

  fastify.addHook('onClose', async () => {
    await disconnectDb()

    fastify.log.info('PostgreSQL Pool and Prisma Client disconnected successfully.')
  })
})