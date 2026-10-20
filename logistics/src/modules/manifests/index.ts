import { FastifyInstance } from "fastify";
import manifestRoutes from "./route.js";

export default async function manifestModule(fastify: FastifyInstance) {
  await fastify.register(manifestRoutes)
}