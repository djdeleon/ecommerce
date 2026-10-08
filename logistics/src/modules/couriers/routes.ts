import { FastifyInstance } from "fastify";
import { StoreSchema, StoreBody, IndexSchema } from "./schema.js";
import { dashboardData, registerCourier } from "./service.js";
import { userAuth } from "#commons/middlewares/user-auth.js";

export default async function courierRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: StoreBody }>(StoreSchema.url, { schema: StoreSchema }, async (req, rep) => {
    const data = await registerCourier(fastify, {
      email: req.body.email,
      password: req.body.password,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      phoneNumber: req.body.phoneNumber,
      vehicleType: req.body.vehicleType,
      plateNumber: req.body.plateNumber,
      status: req.body.status,
      assignedFacilityId: req.body.assignedFacilityId,
    })

    rep.status(201).send({
      message: 'Courier registered.',
      data
    })
  })

  fastify.get(IndexSchema.url, { preHandler: [userAuth] }, async (req, rep) => {
    const data = await dashboardData(fastify);

    return rep.status(200).send({
      message: "Couriers retrieved.",
      data
    })
  })
}