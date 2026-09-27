import { FastifyInstance } from "fastify";
import parcelRoutes from "./routes.js";

export default async function parcelModule(fastify: FastifyInstance) {
  await fastify.register(parcelRoutes)
}