import { FastifyInstance } from "fastify";
import {
  CreateManifestBody,
  CreateManifestSchema,
  ManifestParams,
  ManifestParamsSchema,
  ManifestRouteParamsSchema,
  UpdateManifestBody,
  UpdateManifestSchema,
} from "./schema.js";
import { userAuth } from "#commons/middlewares/user-auth.js";
import { manifests } from "./paths.js";
import { accumulateManifestHandler, arriveManifestHandler, cancelManifestHandler, completeManifestHandler, createManifestHandler, deleteManifestHandler, dispatchManifestHandler, indexManifestHandler, showManifestHandler, updateManifestHandler } from "./controller.js";
import { requireFacility } from "#commons/middlewares/facility-guard.js";

export default async function routes(fastify: FastifyInstance) {
  fastify.get(
    manifests.index,
    { preHandler: [userAuth, requireFacility] },
    indexManifestHandler
  )

  fastify.post<{ Body: CreateManifestBody }>(
    manifests.store,
    {
      schema: CreateManifestSchema,
      preHandler: [userAuth, requireFacility],
    },
    createManifestHandler
  )

  fastify.get<{ Params: ManifestParams }>(
    manifests.show.url,
    {
      schema: ManifestRouteParamsSchema,
      preHandler: [userAuth, requireFacility],
    },
    showManifestHandler
  )

  fastify.put<{ Params: ManifestParams; Body: UpdateManifestBody }>(
    manifests.update.url,
    {
      schema: UpdateManifestSchema,
      preHandler: [userAuth, requireFacility],
    },
    updateManifestHandler
  )

  fastify.patch<{ Params: ManifestParams }>(
    manifests.accumulate.url,
    {
      preHandler: [userAuth],
      schema: ManifestParamsSchema
    },
    accumulateManifestHandler
  )

  fastify.patch<{ Params: ManifestParams }>(
    manifests.dispatch.url,
    {
      preHandler: [userAuth],
      schema: ManifestParamsSchema
    },
    dispatchManifestHandler
  )

  fastify.patch<{ Params: ManifestParams }>(
    manifests.complete.url,
    {
      preHandler: [userAuth],
      schema: ManifestParamsSchema
    },
    completeManifestHandler
  )

  fastify.patch<{ Params: ManifestParams }>(
    manifests.arrive.url,
    {
      preHandler: [userAuth],
      schema: ManifestParamsSchema,
    },
    arriveManifestHandler
  )

  fastify.patch<{ Params: ManifestParams }>(
    manifests.cancel.url,
    {
      preHandler: [userAuth],
      schema: ManifestParamsSchema,
    },
    cancelManifestHandler
  )

  fastify.delete<{ Params: ManifestParams }>(
    manifests.delete.url,
    {
      schema: ManifestRouteParamsSchema,
      preHandler: [userAuth, requireFacility],
    },
    deleteManifestHandler
  )
}