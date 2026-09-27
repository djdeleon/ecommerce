import { FastifyInstance } from "fastify";
import trackingNumberRoutes from "./routes.js";

export default async function trackingNumberModule(fastify: FastifyInstance) {
  await fastify.register(trackingNumberRoutes)
}