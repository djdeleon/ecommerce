import { FastifyInstance } from "fastify";
import { AssignBody, AssignParams, AssignSchema, IndexSchema, StoreBody, StoreSchema } from "./schema.js";
import { createFacility, dashboardData, updateFacility } from "./service.js";
import parseId from "#commons/utils/id-parser.js";
import { userAuth } from "#commons/middlewares/user-auth.js";

export default async function facilityRoutes(fastify: FastifyInstance) {
  fastify.get(IndexSchema.url, { preHandler: [userAuth] }, async (req, rep) => {
    const data = await dashboardData(fastify)

    return rep.status(200).send({
      message: 'Facilities retrieved.',
      data
    })
  })

  fastify.post<{ Body: StoreBody }>(StoreSchema.url, { schema: StoreSchema, preHandler: [userAuth] }, async (req, rep) => {
    const data = await createFacility(fastify, {
      name: req.body.name,
      type: req.body.type,
      address: req.body.address,
      longitude: req.body.longitude,
      latitude: req.body.latitude,
    })

    rep.status(201).send({
      message: "Facility created.",
      data
    })
  })

  fastify.patch<{
    Body: AssignBody,
    Params: AssignParams
  }>(AssignSchema.url, { schema: AssignSchema, preHandler: [userAuth] }, async (req, rep) => {
    console.log('patch')
    const data = await updateFacility(fastify, {
      facilityId: parseId(req.params.facilityId),
      courierId: req.body.courierId
    })

    rep.status(200).send({
      message: "Courier assigned.",
      data
    })
  })
}