import { FastifyInstance } from "fastify";
import { StoreSchema, StoreBody } from "./schema.js";
import { dashboardData, registerCourier } from "./service.js";
import { userAuth } from "#commons/middlewares/user-auth.js";
import { couriers } from "./paths.js";

export default async function courierRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: StoreBody }>(couriers.store, { schema: StoreSchema }, async (req, rep) => {
    const data = await registerCourier(fastify, req.body)

    rep.status(201).send({
      message: 'Courier registered.',
      data
    })
  })

  fastify.get(couriers.index, { preHandler: [userAuth] }, async (req, rep) => {
    const data = await dashboardData(fastify);

    return rep.status(200).send({
      message: "Couriers retrieved.",
      data
    })
  })
}