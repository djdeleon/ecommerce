import { FastifyInstance } from "fastify";
import { createUser } from "../users/service.js";
import { CourierStatus } from "@prisma/client";

interface RegisterCourierData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  vehicleType: string;
  plateNumber: string;
  status: CourierStatus;
}

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
      firstName: data.firstName,
      lastName: data.lastName,
      phoneNumber: data.phoneNumber,
      vehicleType: data.vehicleType,
      plateNumber: data.plateNumber,
      status: data.status
    },
    include: {
      user: true
    }
  })

  return { courier, token }
}