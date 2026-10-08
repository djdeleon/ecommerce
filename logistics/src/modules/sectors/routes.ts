import { FastifyInstance } from "fastify";
import {
  CreateSectorBody,
  CreateSectorSchema,
  DeleteSectorParams,
  DeleteSectorSchema,
  UpdateSectorBody,
  UpdateSectorParams,
  UpdateSectorSchema,
  SECTOR_PATHS
} from "./schema.js";
import parseId from "#commons/utils/id-parser.js";
import { createSector, deleteSector, updateSector } from "./service.js";

export default async function sectorRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: CreateSectorBody }>(
    SECTOR_PATHS.store,
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
    SECTOR_PATHS.update,
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
    SECTOR_PATHS.delete,
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