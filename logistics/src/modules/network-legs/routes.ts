import { FastifyInstance } from "fastify";
import { 
  CreateNetworkLegBody, 
  CreateNetworkLegSchema, 
  DeleteNetworkLegParams, 
  DeleteNetworkLegSchema, 
  UpdateNetworkLegBody, 
  UpdateNetworkLegParams, 
  UpdateNetworkLegSchema, 
} from "./schema.js";
import { createNetworkLeg, deleteNetworkLeg, updateNetworkLeg } from "./service.js";
import { networkLegs } from "./paths.js";

export default async function networkLegRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: CreateNetworkLegBody }>(
    networkLegs.store, 
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
    networkLegs.update.url, 
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
    networkLegs.delete.url,
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