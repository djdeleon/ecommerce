import { FastifyInstance } from "fastify";
import { courierScheduleRoutes, dispatchLogRoutes, physicalVehicleRoutes, vehicleProfileRoutes } from "./routes.js";

export default async function vehicleModule(fastify: FastifyInstance) {
  await fastify.register(vehicleProfileRoutes)
  await fastify.register(physicalVehicleRoutes)
  await fastify.register(courierScheduleRoutes)
  await fastify.register(dispatchLogRoutes)
}