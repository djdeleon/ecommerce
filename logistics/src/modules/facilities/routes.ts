import { FastifyInstance } from "fastify";
import { AssignBody, AssignParams, AssignSchema, StoreBody, StoreSchema } from "./schema.js";
import { createFacility, dashboardData, updateFacility } from "./service.js";
import parseId from "#commons/utils/id-parser.js";
import { userAuth } from "#commons/middlewares/user-auth.js";
import { facilities } from "./paths.js";

export default async function facilityRoutes(fastify: FastifyInstance) {
  fastify.get(facilities.index, { preHandler: [userAuth] }, async (req, rep) => {
    const data = await dashboardData(fastify)

    return rep.status(200).send({
      message: 'Facilities retrieved.',
      data
    })
  })

  fastify.post<{ Body: StoreBody }>(facilities.store, { schema: StoreSchema, preHandler: [userAuth] }, async (req, rep) => {
    const data = await createFacility(fastify, req.body)

    rep.status(201).send({
      message: "Facility created.",
      data
    })
  })

  fastify.patch<{
    Body: AssignBody,
    Params: AssignParams
  }>(facilities.assignCourier.url, { schema: AssignSchema, preHandler: [userAuth] }, async (req, rep) => {
    const data = await updateFacility(fastify, {
      facilityId: parseId(req.params.facilityId),
      userId: req.body.userId
    })

    rep.status(200).send({
      message: "Courier assigned.",
      data
    })
  })
}