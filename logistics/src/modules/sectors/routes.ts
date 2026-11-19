import { FastifyInstance } from "fastify";
import {
  CreateSectorBody,
  CreateSectorSchema,
  DeleteSectorParams,
  DeleteSectorSchema,
  GetSectorParams,
  GetSectorParamsSchema,
  UpdateSectorBody,
  UpdateSectorParams,
  UpdateSectorSchema,
} from "./schema.js";
import { createSector, deleteSector, getSectorById, getSectors, updateSector } from "./service.js";
import { sectors } from "./paths.js";
import { userAuth } from "#commons/middlewares/user-auth.js";
import parseId from "#commons/utils/id-parser.js";

export default async function routes(fastify: FastifyInstance) {
  fastify.get(sectors.index, { preHandler: [userAuth] },
    async (req, rep) => {
      const data = await getSectors(fastify)

      return rep.code(200).send({
        message: 'Sectors retrieved successfully.',
        data,
      })
    }
  )

  fastify.post<{ Body: CreateSectorBody }>(
    sectors.store,
    { schema: CreateSectorSchema, preHandler: [userAuth] },
    async (req, rep) => {
      const data = await createSector(fastify, req.body)

      return rep.code(201).send({
        message: 'Sector created successfully.',
        data,
      })
    }
  )

  fastify.get<{ Params: GetSectorParams }>(
    sectors.show.url,
    { schema: GetSectorParamsSchema, preHandler: [userAuth] },
    async (req, rep) => {
      const id = parseId(req.params.id);
      const data = await getSectorById(fastify, id)

      return rep.code(200).send({
        message: 'Sector retrieved successfully.',
        data,
      })
    }
  )

  fastify.put<{ Body: UpdateSectorBody; Params: UpdateSectorParams }>(
    sectors.update.url,
    { schema: UpdateSectorSchema, preHandler: [userAuth] },
    async (req, rep) => {
      const { id } = req.params

      const updatedSector = await updateSector(fastify, id, req.body)

      return rep.code(200).send({
        message: 'Sector updated successfully.',
        data: updatedSector,
      })
    }
  )

  fastify.delete<{ Params: DeleteSectorParams }>(
    sectors.delete.url,
    { schema: DeleteSectorSchema, preHandler: [userAuth] },
    async (req, rep) => {
      const { id } = req.params

      await deleteSector(fastify, id)

      return rep.code(200).send({
        message: 'Sector deleted successfully.',
      })
    }
  )
}