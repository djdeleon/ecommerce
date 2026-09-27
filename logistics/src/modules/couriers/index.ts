import { FastifyInstance } from "fastify";
import courierRoutes from "./routes.js";

export default async function courierModule(fastify: FastifyInstance) {
  await fastify.register(courierRoutes)
}