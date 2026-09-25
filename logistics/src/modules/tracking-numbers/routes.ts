import { FastifyInstance } from "fastify";
import { IndexSchema, StoreBody, StoreSchema } from "./schema.js";

export default async function trackingNumberRoutes(fastify: FastifyInstance) {
  fastify.get(IndexSchema.url, async (req, rep) => {
    

    return rep.status(200).send({
      message: "Clients retrieved.",
    })
  })

  fastify.post<{ Body: StoreBody }>(StoreSchema.url, { schema: StoreSchema }, async (req, rep) => {
    

    return rep.status(201).send({
      message: 'Client registered.',
    })
  })
}