import { FastifyInstance } from "fastify";
import { physicalVehicleRoutes, vehicleProfileRoutes } from "./routes.js";

export default async function vehicleModule(fastify: FastifyInstance) {
  await fastify.register(vehicleProfileRoutes)
  await fastify.register(physicalVehicleRoutes)
}