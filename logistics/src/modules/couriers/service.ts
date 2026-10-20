import { FastifyInstance } from "fastify";
import { createUser } from "../users/service.js";
import { RegisterCourierData } from "./schema.js";

export async function dashboardData(fastify: FastifyInstance) {
    const couriers = await fastify.prisma.courier.findMany();

    return { 
      couriers, 
      vehicleTypes: ['Truck', 'Van', 'Bike']
    }
}

export async function registerCourier(fastify: FastifyInstance, data: RegisterCourierData) {
  const { user, token } = await createUser(fastify, data)

  const courier = await fastify.prisma.courier.create({
    data: {
      userId: user.id,
      phoneNumber: data.phoneNumber,
      vehicleType: data.vehicleType,
      status: data.status,
    },
    include: {
      user: true
    }
  })

  return { courier, token }
}