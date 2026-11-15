import { FastifyInstance } from "fastify";
import routes from "./routes.js";

export default async function networkLegModule(fastify: FastifyInstance) {
  await fastify.register(routes)
}