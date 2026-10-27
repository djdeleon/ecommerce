import { FastifyInstance } from "fastify"
import { LoginBody, LoginSchema, RegisterBody, RegisterSchema } from "./schemas.js"
import { loginUser, registerUser } from "./service.js"
import { users } from "./paths.js"

export default async function userRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: RegisterBody }>(users.register, { schema: RegisterSchema }, async (req, rep) => {
    const data = await registerUser(fastify, req.body)

    return rep.status(201).send({
      message: 'user registered.',
      data,
    })
  })

  fastify.post<{ Body: LoginBody }>(users.login, { schema: LoginSchema }, async (req, rep) => {
    const data = await loginUser(fastify, req.body)

    return rep.send({
      message: 'User logged in.',
      data,
    })
  })
}