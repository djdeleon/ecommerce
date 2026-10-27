import { FastifyInstance } from "fastify";
import fastifyJwt from "@fastify/jwt";
import fastifyBcrypt from "fastify-bcrypt";
import autoLoad from "@fastify/autoload"
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import fp from "fastify-plugin";
import cors from '@fastify/cors'

export default fp(async function main(fastify: FastifyInstance) {
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = dirname(__filename)
  const isTsRuntime = __filename.endsWith('.ts')
  const scriptExtension = isTsRuntime ? 'ts' : 'js';

  await fastify.register(fastifyJwt, {
    secret: process.env.JWT_SECRET || 'jwt_logistics_development'
  })

  await fastify.register(fastifyBcrypt as any, {
    saltWorkFactor: 10,
  })

  await fastify.register(cors, {
    origin: true
  })

  fastify.get('/', async (request, reply) => {
  return {
    status: "success",
    message: "Hello from the Logistics Fastify Backend microservice!",
    timestamp: new Date().toISOString(),
    system: "Mock 3PL Engine active"
  }
})

  await fastify.register(autoLoad, {
    dir: join(__dirname, 'commons/plugins'),
    matchFilter: (path) => path.endsWith(`.${scriptExtension}`),
  })

  await fastify.register(autoLoad, {
    dir: join(__dirname, 'commons/errors'),
    matchFilter: (path) => path.endsWith(`.${scriptExtension}`),
  })

  await fastify.register(autoLoad, {
    dir: join(__dirname, 'modules'),
    maxDepth: 2,
    matchFilter: (path) => path.endsWith(`.${scriptExtension}`),
    dirNameRoutePrefix: false
  })
})