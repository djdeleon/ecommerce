import { FastifyInstance } from "fastify";
import routes from "./routes.js";

export default async function manifestModule(fastify: FastifyInstance) {
  await fastify.register(routes)
}