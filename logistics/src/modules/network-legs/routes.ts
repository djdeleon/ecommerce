import { FastifyInstance } from "fastify";
import {
  CreateNetworkLegBody,
  CreateNetworkLegSchema,
  DeleteNetworkLegParams,
  DeleteNetworkLegSchema,
  GetNetworkLegSchema,
  UpdateNetworkLegBody,
  UpdateNetworkLegParams,
  UpdateNetworkLegSchema,
} from "./schema.js";
import { createNetworkLeg, deleteNetworkLeg, getNetworkLegById, getNetworkLegs, updateNetworkLeg } from "./service.js";
import { networkLegs } from "./paths.js";
import { userAuth } from "#commons/middlewares/user-auth.js";
import parseId from "#commons/utils/id-parser.js";

export default async function routes(fastify: FastifyInstance) {
  fastify.get(networkLegs.index, { preHandler: [userAuth] }, async (req, rep) => {
    const data = await getNetworkLegs(fastify)

    return rep.code(200).send({
      message: 'Network legs retrieved successfully.',
      data,
    })
  })

  fastify.post<{ Body: CreateNetworkLegBody }>(
    networkLegs.store,
    { schema: CreateNetworkLegSchema, preHandler: [userAuth] },
    async (req, rep) => {
      const data = await createNetworkLeg(fastify, req.body)

      return rep.code(201).send({
        message: 'Network leg created successfully.',
        data,
      })
    }
  )

  fastify.get<{ Params: { id: string } }>(networkLegs.show.url,
    { schema: GetNetworkLegSchema, preHandler: [userAuth] },
    async (req, rep) => {
      const id = parseId(req.params.id)
      const data = await getNetworkLegById(fastify, id)

      return rep.code(200).send({
        message: 'Network leg retrieved successfully.',
        data,
      })
    }
  )

  fastify.put<{ Body: UpdateNetworkLegBody; Params: UpdateNetworkLegParams }>(
    networkLegs.update.url,
    { schema: UpdateNetworkLegSchema, preHandler: [userAuth] },
    async (req, rep) => {
      const id = parseId(req.params.id)
      const data = await updateNetworkLeg(fastify, id, req.body)

      return rep.code(200).send({
        message: 'Network leg updated successfully.',
        data,
      })
    }
  )

  fastify.delete<{ Params: DeleteNetworkLegParams }>(
    networkLegs.delete.url,
    { schema: DeleteNetworkLegSchema, preHandler: [userAuth] },
    async (req, rep) => {
      const id = parseId(req.params.id)
      await deleteNetworkLeg(fastify, id)

      return rep.code(200).send({
        message: 'Network leg deleted successfully.',
      })
    }
  )
}