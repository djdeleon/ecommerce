import { FastifyInstance } from "fastify"
import { GetUsersQuery, GetUsersQuerySchema, LoginBody, LoginSchema, RegisterBody, RegisterSchema, UpdateUserBody, UpdateUserBodySchema, UserParam, UserParamSchema } from "./schemas.js"
import { deleteUser, getUserById, listUsers, loginUser, registerUser, updateUser } from "./service.js"
import { users } from "./paths.js"
import { UserRole } from "@prisma/client"

export default async function routes(fastify: FastifyInstance) {
  fastify.post<{ Body: RegisterBody }>(users.register, { schema: RegisterSchema }, async (req, rep) => {
    const data = await registerUser(fastify, req.body)

    return rep.status(201).send({
      message: 'User is registered successfully.',
      data,
    })
  })

  fastify.post<{ Body: LoginBody }>(users.login, { schema: LoginSchema }, async (req, rep) => {
    const data = await loginUser(fastify, req.body)

    return rep.send({
      message: 'User is logged in successfully.',
      data,
    })
  })

  // --- Standard CRUD for Users ---
  fastify.get<{ Querystring: GetUsersQuery }>(users.list, { schema: { querystring: GetUsersQuerySchema } }, async (req, rep) => {
    const data = await listUsers(fastify, req.query)

    return rep.send({ message: 'Users retrieved successfully.', data })
  })

  fastify.get<{ Params: UserParam }>(users.detail.url, { schema: { params: UserParamSchema } }, async (req, rep) => {
    const userId = Number(req.params.id)
    const data = await getUserById(fastify, userId)

    return rep.send({ message: 'User retrieved successfully.', data })
  })

  fastify.put<{ Params: UserParam; Body: UpdateUserBody }>(users.update.url, { schema: { params: UserParamSchema, body: UpdateUserBodySchema } }, async (req, rep) => {
    const userId = Number(req.params.id)
    const data = await updateUser(fastify, userId, req.body)

    return rep.send({ message: 'User is updated successfully.', data })
  })

  fastify.delete<{ Params: UserParam }>(users.delete.url, { schema: { params: UserParamSchema } }, async (req, rep) => {
    const userId = Number(req.params.id)

    await deleteUser(fastify, userId)
    return rep.send({ message: 'User is deleted successfully.' })
  })

  fastify.get(users.roles, async (req, rep) => {
    const roles = Object.values(UserRole)

    return rep.send({ message: 'User roles retrieved successfully.', data: roles })
  })
}