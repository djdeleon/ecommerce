import { FastifyInstance } from "fastify";
import routes from "./routes.js";

export default async function userModule(fastify: FastifyInstance) {
  await fastify.register(routes)
}