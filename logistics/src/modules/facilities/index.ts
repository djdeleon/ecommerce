import { FastifyInstance } from "fastify";
import facilityRoutes from "./routes.js";

export default async function facilityModule(fastify: FastifyInstance) {
  await fastify.register(facilityRoutes)
}