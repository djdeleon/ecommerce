import { FastifyInstance } from "fastify";
import { sortingBatchRoutes } from "./routes/sorting-batch.route.js";
import { masterBagRoutes } from "./routes/master-bag.route.js";

export default async function sortationModule(fastify: FastifyInstance) {
  await fastify.register(sortingBatchRoutes)
  await fastify.register(masterBagRoutes)
}