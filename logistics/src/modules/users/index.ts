import { FastifyInstance } from "fastify";
import userRoutes from "./routes.js";

export default async function userModule(fastify: FastifyInstance) {
  await fastify.register(userRoutes)
}