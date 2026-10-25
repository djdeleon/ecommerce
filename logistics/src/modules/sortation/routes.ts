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

import { createSortingBatch, deleteSortingBatch, simulateScannerTunnelPass, updateSortingBatch } from "./services/sorting-batch.service.js";
import { CreateMasterBagBody, MASTER_BAG_PATHS, CreateMasterBagSchema, UpdateMasterBagBody, UpdateMasterBagParams, UpdateMasterBagSchema, DeleteMasterBagParams, DeleteMasterBagSchema } from "./schemas/master-bag.schema.js";
import { createMasterBag, updateMasterBag, deleteMasterBag } from "./services/master-bag.service.js";
import { CreateFacilityChuteBody, FACILITY_CHUTE_PATHS, CreateFacilityChuteSchema, UpdateFacilityChuteBody, UpdateFacilityChuteParams, UpdateFacilityChuteSchema, DeleteFacilityChuteParams, DeleteFacilityChuteSchema } from "./schemas/facility-chute.schema.js";
import { createFacilityChute, updateFacilityChute, deleteFacilityChute } from "./services/facility-chute.service.js";
import { MasterBagStatus } from "@prisma/client";
import JsBarcode from "jsbarcode";
import { DOMImplementation, XMLSerializer } from "@xmldom/xmldom";

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

  fastify.post(SORTATION_BATCH_PATHS.tunnelScan, async (req, rep) => {
    const { trackingNumber } = req.params as { trackingNumber: string };

    const result = await simulateScannerTunnelPass(fastify, trackingNumber);

    return rep.code(200).send({
      message: 'Parcel scanned successfully.',
      data: result
    });
  });

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

  fastify.get(MASTER_BAG_PATHS.label, async (req, rep) => {
    const { masterBagCode } = req.params as { masterBagCode: string };

    const masterBag = await fastify.prisma.masterBag.findUniqueOrThrow({
      where: { code: masterBagCode },
      include: {
        currentFacility: true,
        nextFacility: true,
        sortingBatch: true
      }
    });

    // Vector SVG barcode
    const xmlSerializer = new XMLSerializer();
    const document = new DOMImplementation().createDocument('http://w3.org', 'html', null);
    const svgNode = document.createElementNS('http://w3.org', 'svg');

    JsBarcode(svgNode, masterBag.code, {
      xmlDocument: document as any,
      format: "CODE128",
      width: 4,
      height: 100,
      displayValue: false,
    });

    const barcodeSvgHtml = xmlSerializer.serializeToString(svgNode);

    // HTML layout (e.g., 100mm x 100mm label size)
    return rep.type('text/html').send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Master Bag Label - ${masterBag.code}</title>
        <style>
          body { width: 100mm; height: 100mm; margin: 0; padding: 4mm; font-family: Arial; box-sizing: border-box; }
          .label-box { border: 2px solid #000; height: 100%; display: flex; flex-direction: column; padding: 3mm; justify-content: space-between; }
          .header { display: flex; justify-content: space-between; font-weight: bold; font-size: 16px; border-bottom: 2px solid #000; padding-bottom: 2mm; }
          .barcode-section { text-align: center; margin: 2mm 0; }
          .barcode-section svg { width: 100% !important; height: 50px !important; }
          .code-text { font-size: 20px; font-weight: bold; text-align: center; letter-spacing: 1px; }
          .footer-grid { display: flex; border-top: 1px solid #000; padding-top: 2mm; font-size: 12px; }
          .grid-item { flex: 1; }
        </style>
      </head>
      <body>
        <div class="label-box">
          <div class="header">
            <span>MASTER BAG</span>
            <span>BATCH: ${masterBag.sortingBatch.code}</span>
          </div>
          
          <div class="barcode-section">
            ${barcodeSvgHtml}
            <div class="code-text">${masterBag.code}</div>
          </div>

          <div class="footer-grid">
            <div class="grid-item">
              <strong>Origin:</strong> ${masterBag.currentFacility.name}<br>
              <strong>Destination:</strong> ${masterBag.nextFacility.name}
            </div>
            <div class="grid-item" style="text-align: right;">
              <strong>Status:</strong> ${masterBag.status}<br>
              <strong>Created:</strong> ${new Date(masterBag.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>
      </body>
      </html>
    `);
  });

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

  fastify.patch(MASTER_BAG_PATHS.seal, async (req, rep) => {
    const { masterBagCode } = req.params as { masterBagCode: string }

    const masterBag = await fastify.prisma.masterBag.findUniqueOrThrow({
      where: { code: masterBagCode }
    })
    if (masterBag.status !== MasterBagStatus.Open) {
      throw new Error("Master Bag is not allowed to transition to Sealed status.")
    }

    const updatedMasterBag = await fastify.prisma.$transaction(async (tx) => {
      const updatedMasterBag = await tx.masterBag.update({
        where: { id: masterBag.id },
        data: { status: MasterBagStatus.Sealed }
      })

      await tx.masterBagLog.create({
        data: {
          masterBagId: masterBag.id,
          status: MasterBagStatus.Sealed
        }
      })

      return updatedMasterBag
    })

    return rep.code(200).send({
      message: 'Master bag is sealed successfully.',
      data: updatedMasterBag,
    })
  })
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