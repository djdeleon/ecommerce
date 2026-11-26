import { FastifyInstance } from "fastify";
import { clientParcels } from "../paths.js";
import { userAuth } from "#commons/middlewares/user-auth.js";
import { createClientParcelController } from "../controllers/parcel.client.controller.js";
import { CreateClientParcelBody, CreateClientParcelSchema } from "../dto/parcel.client.dto.js";

export default async function clientParcelRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: CreateClientParcelBody }>(
    clientParcels.store,
    { schema: CreateClientParcelSchema, preHandler: [userAuth] },
    createClientParcelController
  );
}