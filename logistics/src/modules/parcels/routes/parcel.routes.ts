import { userAuth } from "#commons/middlewares/user-auth.js";
import { FastifyInstance } from "fastify";
import { parcels } from "../paths.js";
import { CreateParcelBody, CreateParcelSchema } from "../dto/parcel.dto.js";
import { createParcelController } from "../controllers/parcel.controller.js";

export default async function parcelRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: CreateParcelBody }>(
    parcels.store,
    { schema: CreateParcelSchema, preHandler: [userAuth] },
    createParcelController
  );
}