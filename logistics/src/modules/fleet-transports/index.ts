import { FastifyInstance } from "fastify";
import routes from "./routes.js";

export default async function fleetTransportModule(fastify: FastifyInstance) {
  await fastify.register(routes)
}