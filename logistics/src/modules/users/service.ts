import { FastifyInstance } from "fastify"
import { GetUsersQuery, LoginBody, RegisterBody, UpdateUserBody } from "./schemas.js";
import { UserRole } from "@prisma/client";

export async function storeUser(fastify: FastifyInstance, data: RegisterBody) {
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
  const { user: raw, token } = await storeUser(fastify, data)

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

export async function listUsers(fastify: FastifyInstance, query: GetUsersQuery) {
  const where: any = {}

  if (query.role) {
    where.role = query.role
  }

  if (query.assignedFacilityId) {
    where.assignedFacilityId = Number(query.assignedFacilityId)
  }

  if (query.search) {
    where.OR = [
      { firstName: { contains: query.search, mode: 'insensitive' } },
      { lastName: { contains: query.search, mode: 'insensitive' } },
      { email: { contains: query.search, mode: 'insensitive' } },
    ]
  }

  return await fastify.prisma.user.findMany({
    where,
    include: {
      assignedFacility: true,
      courier: true,
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getUserById(fastify: FastifyInstance, id: number) {
  const user = await fastify.prisma.user.findUnique({
    where: { id },
    include: {
      assignedFacility: true,
      courier: true,
    },
  })

  if (!user) {
    throw new Error('User not found.')
  }

  return user
}

export async function updateUser(
  fastify: FastifyInstance, 
  id: number, 
  data: UpdateUserBody
) {
  await getUserById(fastify, id)

  return await fastify.prisma.user.update({
    where: { id },
    data,
    include: {
      assignedFacility: true,
      courier: true,
    },
  })
}

export async function deleteUser(fastify: FastifyInstance, id: number) {
  // Ensure user exists
  await getUserById(fastify, id)

  return await fastify.prisma.user.delete({
    where: { id },
  })
}