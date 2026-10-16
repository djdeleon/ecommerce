import { FastifyInstance } from "fastify";
import { 
  CreateNetworkLegBody, 
  CreateNetworkLegSchema, 
  DeleteNetworkLegParams, 
  DeleteNetworkLegSchema, 
  UpdateNetworkLegBody, 
  UpdateNetworkLegParams, 
  UpdateNetworkLegSchema, 
  NETWORK_LEG_PATHS 
} from "./schema.js";
import parseId from "#commons/utils/id-parser.js";
import { TransitMode } from "@prisma/client";
import { createNetworkLeg, deleteNetworkLeg, updateNetworkLeg } from "./service.js";

export default async function networkLegRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: CreateNetworkLegBody }>(
    NETWORK_LEG_PATHS.store, 
    { schema: CreateNetworkLegSchema }, 
    async (req, rep) => {
      const networkLeg = await createNetworkLeg(fastify, req.body)

      return rep.code(201).send({
        message: 'Network leg created successfully.',
        data: networkLeg,
      })
    }
  )

  fastify.put<{ Body: UpdateNetworkLegBody; Params: UpdateNetworkLegParams }>(
    NETWORK_LEG_PATHS.update, 
    { schema: UpdateNetworkLegSchema },
    async (req, rep) => {
      const { networkLegId } = req.params

      const updatedLeg = await updateNetworkLeg(fastify, networkLegId, req.body)

      return rep.code(200).send({
        message: 'Network leg updated successfully.',
        data: updatedLeg,
      })
    }
  )

  fastify.delete<{ Params: DeleteNetworkLegParams }>(
    NETWORK_LEG_PATHS.delete,
    { schema: DeleteNetworkLegSchema },
    async (req, rep) => {
      const { networkLegId } = req.params

      await deleteNetworkLeg(fastify, networkLegId)

      return rep.code(200).send({
        message: 'Network leg deleted successfully.',
      })
    }
  )
}