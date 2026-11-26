import { FastifyInstance } from "fastify";
import { adminParcels } from "../paths.js";
import { userAuth } from "#commons/middlewares/user-auth.js";
import { createAdminParcelController } from "../controllers/parcel.admin.controller.js";
import { CreateAdminParcelBody, CreateAdminParcelSchema } from "../dto/parcel.admin.dto.js";

export default async function adminParcelRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: CreateAdminParcelBody }>(
    adminParcels.store,
    { schema: CreateAdminParcelSchema, preHandler: [userAuth] },
    createAdminParcelController
  );
}