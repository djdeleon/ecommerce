import { FastifyInstance } from "fastify";
import { store, dashboardData } from "./service.js";
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
    const data = await store(req.body.name)

    return rep.status(201).send({
      message: 'Client registered successfully.',
      data
    })
  })


  fastify.get<{ Params: ClientParams }>(clients.show.url, { schema: ParamsSchema, preHandler: [userAuth] }, async (req, rep) => {
    const clientId = parseInt(req.params.id, 10)
    const client = await fastify.prisma.client.findUniqueOrThrow({
      where: { id: clientId }
    })

    return rep.status(200).send({
      message: 'Client retrieved successfully.',
      data: client
    })
  })

  fastify.put<{ Params: ClientParams; Body: UpdateBody }>(clients.update.url, { schema: UpdateSchema, preHandler: [userAuth] }, async (req, rep) => {
    const clientId = parseInt(req.params.id, 10)
    const updated = await fastify.prisma.client.update({
      where: { id: clientId },
      data: req.body
    })

    return rep.status(200).send({
      message: 'Client updated successfully.',
      data: updated
    })
  })

  fastify.delete<{ Params: ClientParams }>(clients.destroy.url, { schema: ParamsSchema, preHandler: [userAuth] }, async (req, rep) => {
    const clientId = parseInt(req.params.id, 10)

    const parcelsCount = await fastify.prisma.parcel.count({
      where: {
        trackingNumberRel: {
          clientId: clientId
        }
      }
    })

    if (parcelsCount > 0) {
      return rep.status(400).send({
        error: "Conflict",
        message: "Cannot delete client with existing shipment records. Please deactivate the client instead to preserve history."
      })
    }

    try {
      await fastify.prisma.$transaction(async (tx) => {
        await tx.trackingNumberPool.deleteMany({
          where: { clientId }
        })

        await tx.client.delete({
          where: { id: clientId }
        })
      })

      return rep.status(200).send({
        message: 'Client and associated tracking pools deleted successfully.'
      })
    } catch (error) {
      return rep.status(500).send({
        error: "Internal Server Error",
        message: "An error occurred while deleting the client."
      })
    }
  })
}