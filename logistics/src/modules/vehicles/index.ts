import { FastifyInstance } from "fastify";
import { physicalVehicleRoutes } from "./routes/physical-vehicle.route.js";
import { vehicleProfileRoutes } from "./routes/vehicle-profile.route.js";

export default async function vehicleModule(fastify: FastifyInstance) {
  await fastify.register(vehicleProfileRoutes)
  await fastify.register(physicalVehicleRoutes)
}