import { FastifyInstance } from "fastify";
import routes from "./routes.js";

export default async function clientModule(fastify: FastifyInstance) {
  await fastify.register(routes)
}