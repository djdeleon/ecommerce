import { FastifyInstance } from "fastify";
import {
  CreateSortationBatchBody,
  CreateSortationBatchSchema,
  DeleteSortationBatchParams,
  DeleteSortationBatchSchema,
  UpdateSortationBatchBody,
  UpdateSortationBatchParams,
  UpdateSortationBatchSchema,
  SORTATION_BATCH_PATHS
} from "./schemas/sorting-batch.schema.js";

import { createSortingBatch, deleteSortingBatch, updateSortingBatch } from "./services/sorting-batch.service.js";
import { CreateMasterBagBody, MASTER_BAG_PATHS, CreateMasterBagSchema, UpdateMasterBagBody, UpdateMasterBagParams, UpdateMasterBagSchema, DeleteMasterBagParams, DeleteMasterBagSchema } from "./schemas/master-bag.schema.js";
import { createMasterBag, updateMasterBag, deleteMasterBag } from "./services/master-bag.service.js";
import { CreateFacilityChuteBody, FACILITY_CHUTE_PATHS, CreateFacilityChuteSchema, UpdateFacilityChuteBody, UpdateFacilityChuteParams, UpdateFacilityChuteSchema, DeleteFacilityChuteParams, DeleteFacilityChuteSchema } from "./schemas/facility-chute.schema.js";
import { createFacilityChute, updateFacilityChute, deleteFacilityChute } from "./services/facility-chute.service.js";

export async function sortingBatchRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: CreateSortationBatchBody }>(
    SORTATION_BATCH_PATHS.store,
    { schema: CreateSortationBatchSchema },
    async (req, rep) => {
      const batch = await createSortingBatch(fastify, req.body)

      return rep.code(201).send({
        message: 'Sortation batch created successfully.',
        data: batch,
      })
    }
  )

  fastify.put<{ Body: UpdateSortationBatchBody; Params: UpdateSortationBatchParams }>(
    SORTATION_BATCH_PATHS.update,
    { schema: UpdateSortationBatchSchema },
    async (req, rep) => {
      const { sortingBatchId } = req.params

      const updatedBatch = await updateSortingBatch(fastify, sortingBatchId, req.body)

      return rep.code(200).send({
        message: 'Sortation batch updated successfully.',
        data: updatedBatch,
      })
    }
  )

  fastify.delete<{ Params: DeleteSortationBatchParams }>(
    SORTATION_BATCH_PATHS.delete,
    { schema: DeleteSortationBatchSchema },
    async (req, rep) => {
      const { sortingBatchId } = req.params

      await deleteSortingBatch(fastify, sortingBatchId)

      return rep.code(200).send({
        message: 'Sortation batch deleted successfully.',
      })
    }
  )
}

export async function masterBagRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: CreateMasterBagBody }>(
    MASTER_BAG_PATHS.store,
    { schema: CreateMasterBagSchema },
    async (req, rep) => {
      const masterBag = await createMasterBag(fastify, req.body)

      return rep.code(201).send({
        message: 'Master bag created successfully.',
        data: masterBag,
      })
    }
  )

  fastify.put<{ Body: UpdateMasterBagBody; Params: UpdateMasterBagParams }>(
    MASTER_BAG_PATHS.update,
    { schema: UpdateMasterBagSchema },
    async (req, rep) => {
      const { masterBagId } = req.params

      const updatedBag = await updateMasterBag(fastify, masterBagId, req.body)

      return rep.code(200).send({
        message: 'Master bag updated successfully.',
        data: updatedBag,
      })
    }
  )

  fastify.delete<{ Params: DeleteMasterBagParams }>(
    MASTER_BAG_PATHS.delete,
    { schema: DeleteMasterBagSchema },
    async (req, rep) => {
      const { masterBagId } = req.params

      await deleteMasterBag(fastify, masterBagId)

      return rep.code(200).send({
        message: 'Master bag deleted successfully.',
      })
    }
  )
}

export async function facilityChuteRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: CreateFacilityChuteBody }>(
    FACILITY_CHUTE_PATHS.store,
    { schema: CreateFacilityChuteSchema },
    async (req, rep) => {
      const chute = await createFacilityChute(fastify, req.body)

      return rep.code(201).send({
        message: 'Facility chute created successfully.',
        data: chute,
      })
    }
  )

  fastify.put<{ Body: UpdateFacilityChuteBody; Params: UpdateFacilityChuteParams }>(
    FACILITY_CHUTE_PATHS.update,
    { schema: UpdateFacilityChuteSchema },
    async (req, rep) => {
      const { facilityChuteId } = req.params

      const updatedChute = await updateFacilityChute(fastify, facilityChuteId, req.body)

      return rep.code(200).send({
        message: 'Facility chute updated successfully.',
        data: updatedChute,
      })
    }
  )

  fastify.delete<{ Params: DeleteFacilityChuteParams }>(
    FACILITY_CHUTE_PATHS.delete,
    { schema: DeleteFacilityChuteSchema },
    async (req, rep) => {
      const { facilityChuteId } = req.params

      await deleteFacilityChute(fastify, facilityChuteId)

      return rep.code(200).send({
        message: 'Facility chute deleted successfully.',
      })
    }
  )
}