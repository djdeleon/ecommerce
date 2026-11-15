import { FastifyInstance } from "fastify";
import { storeUser } from "../users/service.js";
import { RegisterCourierData } from "./schema.js";
import { UserRole } from "@prisma/client";

export async function dashboardData(fastify: FastifyInstance) {
    const couriers = await fastify.prisma.courier.findMany();

    return { 
      couriers, 
      vehicleTypes: ['Truck', 'Van', 'Bike']
    }
}

export async function registerCourier(fastify: FastifyInstance, data: RegisterCourierData) {
  const { user, token } = await storeUser(fastify, {
    ...data,
    role: UserRole.Courier
  })

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