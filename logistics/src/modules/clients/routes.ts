import { FastifyInstance } from "fastify";
import { createClient, dashboardData } from "./service.js";
import { IndexSchema, StoreBody, StoreSchema } from "./schema.js";

export default async function clientRoutes(fastify: FastifyInstance) {
  fastify.get(IndexSchema.url, async (req, rep) => {
    const data = await dashboardData(fastify)

    return rep.status(200).send({
      message: "Clients retrieved.",
      data
    })
  })

  fastify.post<{ Body: StoreBody }>(StoreSchema.url, { schema: StoreSchema }, async (req, rep) => {
    const client = await createClient(fastify, req.body.name)

    return rep.status(201).send({
      message: 'Client registered.',
      data: client
    })
  })
}