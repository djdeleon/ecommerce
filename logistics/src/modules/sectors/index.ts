import { FastifyInstance } from "fastify";
import sectorRoutes from "./routes.js";

export default async function userModule(fastify: FastifyInstance) {
  await fastify.register(sectorRoutes)
}