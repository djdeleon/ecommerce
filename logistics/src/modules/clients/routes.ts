import { FastifyInstance } from "fastify";
import { createClient, dashboardData } from "./service.js";
import { StoreBody, StoreSchema } from "./schema.js";
import { clients } from "./paths.js";

export default async function clientRoutes(fastify: FastifyInstance) {
  fastify.get(clients.index, async (req, rep) => {
    const data = await dashboardData()

    return rep.status(200).send({
      message: "Clients retrieved.",
      data
    })
  })

  fastify.post<{ Body: StoreBody }>(clients.store, { schema: StoreSchema }, async (req, rep) => {
    const client = await createClient(req.body.name)

    return rep.status(201).send({
      message: 'Client registered.',
      data: client
    })
  })
}