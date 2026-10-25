import { FastifyInstance } from "fastify";
import deliveryRoutes from "./routes.js";

export default async function manifestModule(fastify: FastifyInstance) {
  await fastify.register(deliveryRoutes)
}