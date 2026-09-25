import { FastifyInstance } from "fastify"
import { LoginBody, LoginSchema, RegisterBody, RegisterSchema } from "./schemas.js"
import { loginUser, registerUser } from "./service.js"

export default async function userRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: RegisterBody }>(RegisterSchema.url, { schema: RegisterSchema }, async (req, rep) => {
    const data = await registerUser(fastify, {
      email: req.body.email,
      password: req.body.password,
      role: req.body.role,
    })

    return rep.status(201).send({
      message: 'user registered.',
      data,
    })
  })

  fastify.post<{ Body: LoginBody }>(LoginSchema.url, { schema: LoginSchema }, async (req, rep) => {
    const data = await loginUser(fastify, {
      email: req.body.email,
      password: req.body.password,
    })

    return rep.send({
      message: 'User logged in.',
      data,
    })
  })
}