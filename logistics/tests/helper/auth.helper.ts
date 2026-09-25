import { FastifyInstance } from "fastify";

export async function actAsCourier(app: FastifyInstance, user: { id: number }) {
  await app.ready();

  const token = app.jwt.sign({ id: user.id })

  return {
    authorization: `Bearer ${token}`
  }
}
