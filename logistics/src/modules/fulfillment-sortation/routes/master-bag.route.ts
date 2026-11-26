import { userAuth } from "#commons/middlewares/user-auth.js";
import { MasterBagStatus, ParcelStatus } from "@prisma/client";
import { FastifyInstance } from "fastify";
import JsBarcode from "jsbarcode";
import { generateEventDescription } from "../../parcel-logs (TBD)/logisticsEventDictionary.js";
import { CreateMasterBagBody, CreateMasterBagSchema, UpdateMasterBagBody, UpdateMasterBagParams, UpdateMasterBagSchema, DeleteMasterBagParams, DeleteMasterBagSchema, ShowMasterBagParams, ShowMasterBagSchema } from "../schemas/master-bag.schema.js";
import { createMasterBag, updateMasterBag, deleteMasterBag, getMasterBagById, getDashboardData } from "../services/master-bag.service.js";
import { masterBags } from "../paths/master-bag.path.js";
import { DOMImplementation, XMLSerializer } from "@xmldom/xmldom";

export async function masterBagRoutes(fastify: FastifyInstance) {
  fastify.get(masterBags.index, { preHandler: [userAuth] }, async (req, rep) => {
    const data = await getDashboardData(fastify);

    return rep.code(200).send({
      message: 'Master bags retrieved successfully.',
      data
    })
  })

  fastify.post<{ Body: CreateMasterBagBody }>(masterBags.store, {
    schema: CreateMasterBagSchema,
    preHandler: [userAuth],

  },
    async (req, rep) => {
      const masterBag = await createMasterBag(fastify, req.body)

      return rep.code(201).send({
        message: 'Master bag created successfully.',
        data: masterBag,
      })
    }
  )

  fastify.get<{ Params: ShowMasterBagParams }>(masterBags.show.url, {
    schema: ShowMasterBagSchema,
    preHandler: [userAuth],
  }, async (req, rep) => {
    const masterBag = await getMasterBagById(fastify, req.params.id);

    return rep.code(200).send({
      message: 'Master bag retrieved successfully.',
      data: masterBag,
    });
  });

  fastify.get(masterBags.label.url, async (req, rep) => {
    const { code } = req.params as { code: string };

    const masterBag = await fastify.prisma.masterBag.findUniqueOrThrow({
      where: { code: code },
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

  fastify.put<{ Body: UpdateMasterBagBody; Params: UpdateMasterBagParams }>(masterBags.update.url, {
    schema: UpdateMasterBagSchema,
    preHandler: [userAuth],
  },
    async (req, rep) => {
      const { id } = req.params

      const updatedBag = await updateMasterBag(fastify, id, req.body)

      return rep.code(200).send({
        message: 'Master bag updated successfully.',
        data: updatedBag,
      })
    }
  )

  fastify.delete<{ Params: DeleteMasterBagParams }>(masterBags.delete.url, {
    schema: DeleteMasterBagSchema,
    preHandler: [userAuth],
  },
    async (req, rep) => {
      const { id } = req.params

      await deleteMasterBag(fastify, id)

      return rep.code(200).send({
        message: 'Master bag deleted successfully.',
      })
    }
  )

  fastify.patch(masterBags.seal.url, { preHandler: [userAuth] }, async (req, rep) => {
    const { code } = req.params as { code: string }

    const masterBag = await fastify.prisma.masterBag.findUniqueOrThrow({
      where: { code: code },
      include: { parcels: true }
    })
    if (masterBag.status !== MasterBagStatus.Open) {
      throw new Error("Master Bag is not allowed to transition to Sealed status.")
    }

    const updatedMasterBag = await fastify.prisma.$transaction(async (tx) => {
      const updatedMasterBag = await tx.masterBag.update({
        where: { id: masterBag.id },
        data: {
          status: MasterBagStatus.Sealed,
          sealedAt: new Date()
        }
      })

      await tx.masterBagLog.create({
        data: {
          masterBagId: masterBag.id,
          status: MasterBagStatus.Sealed
        }
      })

      const parcelIds = masterBag.parcels.map(p => p.id)
      if (parcelIds.length > 0) {
        await tx.parcel.updateMany({
          where: { id: { in: parcelIds } },
          data: { status: ParcelStatus.Bagged }
        })

        for (const parcelId of parcelIds) {
          await tx.parcelLog.create({
            data: {
              parcelId,
              status: ParcelStatus.Bagged,
              description: generateEventDescription({ status: ParcelStatus.Bagged })
            }
          })
        }
      }

      return updatedMasterBag
    })

    return rep.code(200).send({
      message: 'Master bag is sealed successfully.',
      data: updatedMasterBag,
    })
  })

  fastify.patch(masterBags.dispatched.url, async (req, rep) => {
    const { code } = req.params as { code: string }

    const updatedMasterBag = await fastify.prisma.$transaction(async (tx) => {
      const masterBag = await tx.masterBag.findUniqueOrThrow({
        where: { code: code },
        include: { parcels: true }
      })

      const updated = await tx.masterBag.update({
        where: { id: masterBag.id },
        data: { status: MasterBagStatus.Dispatched }
      })

      await tx.masterBagLog.create({
        data: {
          masterBagId: masterBag.id,
          status: MasterBagStatus.Dispatched
        }
      })

      const parcelIds = masterBag.parcels.map(p => p.id)
      if (parcelIds.length > 0) {
        await tx.parcel.updateMany({
          where: { id: { in: parcelIds } },
          data: { status: ParcelStatus.DepartedFromHub }
        })

        for (const parcelId of parcelIds) {
          await tx.parcelLog.create({
            data: {
              parcelId,
              status: ParcelStatus.DepartedFromHub,
              description: generateEventDescription({ status: ParcelStatus.DepartedFromHub })
            }
          })
        }
      }

      return updated
    })

    return rep.code(200).send({
      message: 'Master bag dispatched successfully.',
      data: updatedMasterBag
    })
  })

  fastify.patch(masterBags.delivered.url, async (req, rep) => {
    const { code } = req.params as { code: string }

    const updatedMasterBag = await fastify.prisma.$transaction(async (tx) => {
      const masterBag = await tx.masterBag.findUniqueOrThrow({
        where: { code: code },
        include: { parcels: true, nextFacility: true }
      })

      const updated = await tx.masterBag.update({
        where: { id: masterBag.id },
        data: {
          status: MasterBagStatus.Delivered,
          currentFacilityId: masterBag.nextFacilityId
        }
      })

      await tx.masterBagLog.create({
        data: {
          masterBagId: masterBag.id,
          status: MasterBagStatus.Delivered
        }
      })

      const parcelIds = masterBag.parcels.map(p => p.id)
      if (parcelIds.length > 0) {
        for (const parcel of masterBag.parcels) {
          const isFinalDestination = parcel.destinationFacilityId === masterBag.nextFacilityId;
          const targetStatus = isFinalDestination ? ParcelStatus.ArrivedAtDestinationHub : ParcelStatus.ArrivedAtHub;

          await tx.parcel.update({
            where: { id: parcel.id },
            data: {
              status: targetStatus,
              currentFacilityId: masterBag.nextFacilityId
            }
          })

          await tx.parcelLog.create({
            data: {
              parcelId: parcel.id,
              status: targetStatus,
              description: generateEventDescription({
                status: targetStatus,
                hubName: masterBag.nextFacility?.name || 'Destination Hub'
              })
            }
          })
        }
      }

      return updated
    })

    return rep.code(200).send({
      message: 'Master bag delivered successfully.',
      data: updatedMasterBag
    })
  })

  fastify.patch(masterBags.unbag.url, async (req, rep) => {
    const { code } = req.params as { code: string }

    const updatedMasterBag = await fastify.prisma.$transaction(async (tx) => {
      const masterBag = await tx.masterBag.findUniqueOrThrow({
        where: { code: code },
        include: { parcels: true }
      })

      if (masterBag.status !== MasterBagStatus.Delivered) {
        throw new Error("Master Bag must be Delivered before it can be unbagged.")
      }

      const parcelIds = masterBag.parcels.map(p => p.id)
      if (parcelIds.length > 0) {
        await tx.parcel.updateMany({
          where: { id: { in: parcelIds } },
          data: { masterBagId: null }
        })
      }

      const updated = await tx.masterBag.update({
        where: { id: masterBag.id },
        data: { status: MasterBagStatus.Unbagged }
      })

      await tx.masterBagLog.create({
        data: {
          masterBagId: masterBag.id,
          status: MasterBagStatus.Unbagged
        }
      })

      return updated
    })

    return rep.code(200).send({
      message: 'Master bag unbagged successfully. Parcels released to loose inventory.',
      data: updatedMasterBag
    })
  })
}