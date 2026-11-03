import { FastifyInstance } from "fastify"
import { LoginBody, RegisterBody } from "./schemas.js";
import { UserRole } from "@prisma/client";

export async function createUser(fastify: FastifyInstance, data: RegisterBody) {
  const existingUser = await fastify.prisma.user.findUnique({
    where: { email: data.email }
  })

  if (existingUser) {
    throw new Error('EmailExists')
  }

  const hashedPassword = await fastify.bcrypt.hash(data.password)

  const role = data.role ?? UserRole.Admin

  const user = await fastify.prisma.user.create({
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      password: hashedPassword,
      role,
      assignedFacilityId: data.assignedFacilityId
    }
  })

  const token = fastify.jwt.sign({ id: user.id })
  return { user, token }
}

export async function registerUser(fastify: FastifyInstance, data: RegisterBody) {
  const { user: raw, token } = await createUser(fastify, data)

  const { password: _, ...user } = raw

  return { user, token }
}

export async function loginUser(fastify: FastifyInstance, data: LoginBody) {
  const userRecord = await fastify.prisma.user.findUnique({
    where: { email: data.email }
  })

  if (!userRecord) {
    throw new Error('InvalidCredentials')
  }

  const isValid = await fastify.bcrypt.compare(data.password, userRecord.password)

  if (!isValid) {
    throw new Error('InvalidCredentials')
  }

  const token = fastify.jwt.sign({ id: userRecord.id })

  const { password: _, ...user } = userRecord

  return { user, token }
}