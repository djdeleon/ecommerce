import { FastifyInstance } from "fastify";
import networkLegRoutes from "./routes.js";

export default async function networkLegModule(fastify: FastifyInstance) {
  await fastify.register(networkLegRoutes)
}