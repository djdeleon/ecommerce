import { FastifyInstance } from "fastify";
import { AssignBody, AssignParams, AssignSchema, DeleteSchema, StoreBody, StoreSchema, UpdateFacilityBody, UpdateSchema } from "./schema.js";
import { assignCourierToFacility, createFacility, dashboardData, deleteFacility, getFacilityById, getFacilityCouriers, updateFacility } from "./service.js";
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

  fastify.get(facilities.show.url, { preHandler: [userAuth] }, async (req, rep) => {
    const { id } = req.params as { id: string };
    const parsedId = parseId(id)

    const data = await getFacilityById(fastify, parsedId)

    return rep.status(200).send({
      message: 'Facility Data retrieved successfully.',
      data
    })
  })

  fastify.post<{ Body: StoreBody }>(facilities.store, { schema: StoreSchema, preHandler: [userAuth] }, async (req, rep) => {
    const data = await createFacility(fastify, req.body)

    rep.status(201).send({
      message: "Facility created successfully.",
      data
    })
  })

  fastify.put<{ Params: AssignParams, Body: UpdateFacilityBody }>(facilities.update.url, { schema: UpdateSchema, preHandler: [userAuth] }, async (req, rep) => {
    const id = parseId(req.params.id);
    const data = await updateFacility(fastify, id, req.body);

    return rep.status(200).send({
      message: "Facility updated successfully.",
      data
    });
  })

  fastify.delete<{ Params: AssignParams }>(facilities.delete.url, { schema: DeleteSchema, preHandler: [userAuth] }, async (req, rep) => {
    const id = parseId(req.params.id);
    await deleteFacility(fastify, id);

    return rep.status(200).send({
      message: "Facility deleted successfully."
    });
  })

  fastify.patch<{
    Body: AssignBody,
    Params: AssignParams
  }>(facilities.assignCourier.url, { schema: AssignSchema, preHandler: [userAuth] }, async (req, rep) => {
    const data = await assignCourierToFacility(fastify, {
      id: parseId(req.params.id),
      userId: req.body.userId
    })

    rep.status(200).send({
      message: "Courier assigned.",
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
}