import { FastifyInstance } from "fastify";
import { AssignBody, AssignParams, AssignSchema, StoreBody, StoreSchema } from "./schema.js";
import { createFacility, dashboardData, getFacility, getFacilityCouriers, updateFacility } from "./service.js";
import parseId from "#commons/utils/id-parser.js";
import { userAuth } from "#commons/middlewares/user-auth.js";
import { facilities } from "./paths.js";

export default async function routes(fastify: FastifyInstance) {
  fastify.get(facilities.index, { preHandler: [userAuth] }, async (req, rep) => {
    const data = await dashboardData(fastify)

    return rep.status(200).send({
      message: 'Facilities retrieved.',
      data
    })
  })

  fastify.get(facilities.couriers, { preHandler: [userAuth] }, async (req, rep) => {
    const manager = (req as any).user;

    const data = await getFacilityCouriers(fastify, manager.assignedFacilityId)

    return rep.status(200).send({
      message: 'Facility Couriers retrieved successfully.',
      data
    })
  })

  fastify.get(facilities.show.url, { preHandler: [userAuth] }, async (req, rep) => {
    const { id } = req.params as { id: string };
    const parsedId = parseId(id)

    const data = await getFacility(fastify, parsedId)

    return rep.status(200).send({
      message: 'Facility Data retrieved.',
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
      id: parseId(req.params.id),
      userId: req.body.userId
    })

    rep.status(200).send({
      message: "Courier assigned.",
      data
    })
  })
}