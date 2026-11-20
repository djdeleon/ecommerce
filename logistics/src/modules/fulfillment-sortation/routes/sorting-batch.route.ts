import { userAuth } from "#commons/middlewares/user-auth.js";
import { FastifyInstance } from "fastify";
import { CreateSortationBatchBody, CreateSortationBatchSchema, UpdateSortationBatchBody, UpdateSortationBatchParams, UpdateSortationBatchSchema, DeleteSortationBatchParams, DeleteSortationBatchSchema, ShowSortationBatchParams, ShowSortationBatchSchema } from "../schemas/sorting-batch.schema.js";
import { createSortingBatch, simulateScannerTunnelPass, updateSortingBatch, deleteSortingBatch, getSortingBatchById, getDashboardData } from "../services/sorting-batch.service.js";
import { sortingBatches } from "../paths/sorting-batch.path.js";

export async function sortingBatchRoutes(fastify: FastifyInstance) {
  fastify.get(sortingBatches.index, { preHandler: [userAuth] }, async (req, rep) => {
    const data = await getDashboardData(fastify);

    return rep.status(200).send({
      message: "Sortation batches retrieved successfully.",
      data,
    });
  });

  fastify.post<{ Body: CreateSortationBatchBody }>(sortingBatches.store, {
    schema: CreateSortationBatchSchema,
    preHandler: [userAuth]
  },
    async (req, rep) => {
      const batch = await createSortingBatch(fastify, req.body)

      return rep.code(201).send({
        message: 'Sortation batch created successfully.',
        data: batch,
      })
    }
  )

  fastify.post(sortingBatches.tunnelScan.url, { preHandler: [userAuth] }, async (req, rep) => {
    const { trackingNumber } = req.params as { trackingNumber: string };

    const result = await simulateScannerTunnelPass(fastify, trackingNumber);

    return rep.code(200).send({
      message: 'Parcel scanned successfully.',
      data: result
    });
  });

  fastify.get<{ Params: ShowSortationBatchParams }>(sortingBatches.show.url, {
    schema: ShowSortationBatchSchema,
    preHandler: [userAuth]
  }, async (req, rep) => {
    const batch = await getSortingBatchById(fastify, req.params.id);

    return rep.status(200).send({
      message: 'Sortation batch retrieved successfully.',
      data: batch,
    });
  });

  fastify.put<{ Body: UpdateSortationBatchBody; Params: UpdateSortationBatchParams }>(sortingBatches.update.url, {
    schema: UpdateSortationBatchSchema,
    preHandler: [userAuth],
  },
    async (req, rep) => {
      const { id } = req.params

      const updatedBatch = await updateSortingBatch(fastify, id, req.body)

      return rep.code(200).send({
        message: 'Sortation batch updated successfully.',
        data: updatedBatch,
      })
    }
  )

  fastify.delete<{ Params: DeleteSortationBatchParams }>(sortingBatches.delete.url, {
    schema: DeleteSortationBatchSchema,
    preHandler: [userAuth],
  },
    async (req, rep) => {
      const { id } = req.params

      await deleteSortingBatch(fastify, id)

      return rep.code(200).send({
        message: 'Sortation batch deleted successfully.',
      })
    }
  )
}