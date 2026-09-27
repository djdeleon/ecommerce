import { FastifyInstance } from "fastify";

export function generateToken(fastify: FastifyInstance, id: number) {
  return fastify.jwt.sign({ id })
}