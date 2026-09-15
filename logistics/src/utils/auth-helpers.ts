import { FastifyInstance } from "fastify";

export async function actAsCourier(app: FastifyInstance, courier: { id: number }) {
  await app.ready();

  const token = app.jwt.sign({ id: courier.id })

  return {
    authorization: `Bearer ${token}`
  }
}