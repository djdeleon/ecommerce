import { FastifyInstance } from "fastify";
import clientRoutes from "./routes.js";

export default async function clientModule(fastify: FastifyInstance) {
  await fastify.register(clientRoutes)
}