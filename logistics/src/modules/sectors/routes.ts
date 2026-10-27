import { FastifyInstance } from "fastify";
import {
  CreateSectorBody,
  CreateSectorSchema,
  DeleteSectorParams,
  DeleteSectorSchema,
  UpdateSectorBody,
  UpdateSectorParams,
  UpdateSectorSchema,
} from "./schema.js";
import { createSector, deleteSector, updateSector } from "./service.js";
import { sectors } from "./paths.js";

export default async function sectorRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: CreateSectorBody }>(
    sectors.store,
    { schema: CreateSectorSchema },
    async (req, rep) => {
      const sector = await createSector(fastify, req.body)

      return rep.code(201).send({
        message: 'Sector created successfully.',
        data: sector,
      })
    }
  )

  fastify.put<{ Body: UpdateSectorBody; Params: UpdateSectorParams }>(
    sectors.update.url,
    { schema: UpdateSectorSchema },
    async (req, rep) => {
      const { sectorId } = req.params

      const updatedSector = await updateSector(fastify, sectorId, req.body)

      return rep.code(200).send({
        message: 'Sector updated successfully.',
        data: updatedSector,
      })
    }
  )

  fastify.delete<{ Params: DeleteSectorParams }>(
    sectors.delete.url,
    { schema: DeleteSectorSchema },
    async (req, rep) => {
      const { sectorId } = req.params

      await deleteSector(fastify, sectorId)

      return rep.code(200).send({
        message: 'Sector deleted successfully.',
      })
    }
  )
}