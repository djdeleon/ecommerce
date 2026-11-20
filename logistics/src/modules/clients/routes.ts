import { FastifyInstance } from "fastify";
import { dashboardData, destroyClient, getClientById, storeClient, updateClient } from "./service.js";
import { ClientParams, ParamsSchema, StoreBody, StoreSchema, UpdateBody, UpdateSchema } from "./schema.js";
import { clients } from "./paths.js";
import { userAuth } from "#commons/middlewares/user-auth.js";

export default async function routes(fastify: FastifyInstance) {
  fastify.get(clients.index, { preHandler: [userAuth] }, async (req, rep) => {
    const data = await dashboardData()

    return rep.status(200).send({
      message: "Clients retrieved successfully.",
      data
    })
  })

  fastify.post<{ Body: StoreBody }>(clients.store, { schema: StoreSchema, preHandler: [userAuth] }, async (req, rep) => {
    const data = await storeClient(req.body.name)

    return rep.status(201).send({
      message: 'Client registered successfully.',
      data
    })
  })

  fastify.get<{ Params: ClientParams }>(clients.show.url, { schema: ParamsSchema, preHandler: [userAuth] }, async (req, rep) => {
    const clientId = parseInt(req.params.id, 10)
    const data = await getClientById(clientId)

    return rep.status(200).send({
      message: 'Client retrieved successfully.',
      data
    })
  })

  fastify.put<{ Params: ClientParams; Body: UpdateBody }>(clients.update.url, { schema: UpdateSchema, preHandler: [userAuth] }, async (req, rep) => {
    const clientId = parseInt(req.params.id, 10)
    const data = await updateClient(clientId, req.body)

    return rep.status(200).send({
      message: 'Client updated successfully.',
      data
    })
  })

  fastify.delete<{ Params: ClientParams }>(clients.destroy.url, { schema: ParamsSchema, preHandler: [userAuth] }, async (req, rep) => {
    const clientId = parseInt(req.params.id, 10)
    await destroyClient(clientId)

    return rep.status(200).send({
      message: 'Client and associated tracking pools deleted successfully.'
    })
  })
}