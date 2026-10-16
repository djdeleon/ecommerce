import { FastifyInstance } from "fastify";
import { facilityChuteRoutes, masterBagRoutes, sortingBatchRoutes } from "./routes.js";

export default async function sortationModule(fastify: FastifyInstance) {
  await fastify.register(sortingBatchRoutes)
  await fastify.register(masterBagRoutes)
  await fastify.register(facilityChuteRoutes)
}