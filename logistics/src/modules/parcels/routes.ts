import { FastifyInstance } from "fastify";
import { StoreBody, StoreSchema, waybillSchema } from "./schema.js";
import { createParcel } from "./service.js";
import { ShipmentStatus } from "@prisma/client";
import { createTrackingLog } from "../tracking-logs/service.js";
import parcelAuth from "#commons/middlewares/client-auth.js";
import { activateTrackingNumber } from "../tracking-numbers/service.js";
import JsBarcode from "jsbarcode";
import { DOMImplementation, XMLSerializer } from "@xmldom/xmldom";

export default async function parcelRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: StoreBody }>(StoreSchema.url, {
    schema: StoreSchema,
    // preHandler: [parcelAuth]
  }, async (req, rep) => {
    const { merchant_details, order_info, parcel_info, customer_details } = req.body

    const parcel = await fastify.prisma.$transaction(async (tx) => {
      const parcel = await createParcel(tx, {
        merchant_details,
        customer_details,
        order_info,
        parcel_info,
      })

      await createTrackingLog(tx, {
        parcelId: parcel.id,
        status: ShipmentStatus.PendingPickup,
      })

      await activateTrackingNumber((req as any).clientId, order_info.tracking_number, tx)

      return parcel
    })

    return rep.status(201).send({
      status: true,
      message: 'Parcel booked successfully.',
      data: {
        "tracking_number": parcel.tracking_number,
        "status": parcel.status,
        "routing": {
          "pipeline": parcel.routing_pipeline_cache,
          "sorting_code": parcel.sorting_code_cache,
        },
        "label_url": `https://logistics:8000/${parcel.tracking_number}/waybill`
      }
    })
  })

  fastify.get(waybillSchema.url, async (req, rep) => {
    const trackingNumber = (req.params as any).trackingNumber
    const { prisma } = req.server

    const parcel = await prisma.parcel.findUnique({
      where: { trackingNumber },
      include: { originFacility: true, destinationFacility: true }
    })
    console.log(parcel)

    const sortingBlocks = parcel?.sortingCodeCache ? parcel.sortingCodeCache.split('-') : ['BR', 'RH', 'MG']
    console.log(sortingBlocks)

    while (sortingBlocks.length < 3) {
      sortingBlocks.unshift(""); // Push empty blocks forward to preserve right-aligned priority grids
    }
    console.log(sortingBlocks)

    const localBranchCode = sortingBlocks[0] || "GMC-01"; // e.g., GMC-01
    const regionalHubCode = sortingBlocks[1] || "BUL-RH"; // e.g., BUL-RH
    const megaGatewayCode = sortingBlocks[2] || "MRL-MG"; // e.g., MRL-MG

    console.log({
      localBranchCode,
      regionalHubCode,
      megaGatewayCode
    })
    const xmlSerializer = new XMLSerializer()
    const document = new DOMImplementation().createDocument('http://w3.org', 'html', null)
    const svgNode = document.createElementNS('http://w3.org', 'svg');

    JsBarcode(svgNode, trackingNumber, {
      xmlDocument: document as any,
      format: "CODE128",
      width: 5.2,
      height: 140,
      displayValue: false,
    });

    const barcodeSvgHtml = xmlSerializer.serializeToString(svgNode)
    // return rep.status(200).send({
    //   status: true,
    //   message: 'Viva'
    // })



    return rep.type('text/html').send(`
      <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Waybill - ${trackingNumber}</title>
      <style>
        @page {
          size: 100mm 150mm;
          margin: 0;
        }
        * {
          box-sizing: border-box;
          font-family: Arial, Helvetica, sans-serif;
        }
        body {
          width: 100mm;
          height: 150mm;
          margin: 0;
          padding: 3mm;
          background: #fff;
          color: #000;
          display: flex;
          justify-content: center;
        }
        .waybill-container {
          width: 100%;
          height: 100%;
          border: 1px solid #000;
          display: flex;
          flex-direction: column;
        }
        
        /* === AUTHENTIC SPX HEADER GRID === */
        .spx-header {
          display: flex;
          border-bottom: 1px solid #000;
          height: 32mm;
        }
        .header-left-brand {
          width: 35%;
          border-right: 1px solid #000;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 26px;
          font-weight: 900;
          font-style: italic;
          letter-spacing: -1px;
        }
        .header-mid-rts {
          width: 42%;
          border-right: 1px solid #000;
          display: flex;
          flex-direction: column;
          padding: 1.5mm;
          justify-content: space-between;
        }
        .rts-code {
          font-size: 14px;
          font-weight: bold;
          letter-spacing: 0.5px;
        }
        .rts-label {
          font-size: 8px;
          color: #444;
        }
        .header-right-routing {
          width: 26%;
          border-right: 1px solid #000;
          display: flex;
          flex-direction: column;
        }
        .routing-top-row {
          display: flex;
          height: 50%;
          border-bottom: 1px solid #000;
        }
        .rt-box {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: bold;
        }
        .rt-box-sub {
          font-size: 8px;
          font-weight: normal;
          margin-top: -2px;
        }
        .rt-divider {
          border-right: 1px solid #000;
        }
        .routing-mid-row {
          height: 32%;
          border-bottom: 1px solid #000;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: bold;
          letter-spacing: 0.5px;
        }
        .routing-bottom-row {
          height: 18%;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          padding-right: 2mm;
          font-size: 9px;
          font-weight: bold;
        }
        .header-far-right-anchor {
          width: 12%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: bold;
          background: #f0f0f0; /* Clear placeholder matching the real label grid */
        }

        /* === ORDER ID RIBBON === */
        .order-id-ribbon {
          border-bottom: 1px solid #000;
          padding: 1mm 2mm;
          font-size: 10px;
          font-weight: bold;
          letter-spacing: 0.5px;
        }

        /* === BARCODE SECTION === */
        .barcode-section {
          padding: 2mm 0;
          text-align: center;
          border-bottom: 1px solid #000;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        .barcode-wrapper {
          width: 92%;
        }
        .barcode-wrapper svg {
          width: 100% !important;
          height: 45px !important;
        }
        .tracking-number-text {
          font-size: 18px;
          font-weight: bold;
          margin-top: -1mm;
        }

        /* === ADDRESS DETAILS TABLE === */
        .details-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 8.5px;
        }
        .details-table th {
          border-bottom: 1px solid #000;
          padding: 0.5mm 2mm;
          text-align: center;
          font-weight: bold;
          text-transform: uppercase;
          background: #fafafa;
        }
        .details-table th.left-col {
          border-right: 1px solid #000;
          width: 50%;
        }
        .details-table td {
          padding: 1.5mm 2mm;
          vertical-align: top;
          line-height: 1.3;
        }
        .details-table td.left-col {
          border-right: 1px solid #000;
        }
        .address-name {
          font-weight: bold;
          font-size: 9px;
          margin-bottom: 0.5mm;
        }

        /* === SECTOR MILESTONE FOOTER ROW === */
        .sector-flow-row {
          border-top: 1px solid #000;
          border-bottom: 1px solid #000;
          display: flex;
          font-size: 8px;
          height: 8mm;
        }
        .sector-flow-cell {
          flex: 1;
          border-right: 1px solid #000;
          padding: 1mm;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        .sector-flow-cell:last-child {
          border-right: none;
        }
        .sector-flow-title {
          color: #555;
        }
        .sector-flow-value {
          font-weight: bold;
        }

        /* === GRAPH TIMELINE MAP === */
        .pipeline-map-footer {
          margin-top: auto;
          padding: 1.5mm;
          background: #f4f4f4;
          font-size: 7.5px;
          text-align: center;
          font-weight: bold;
          border-top: 1px solid #000;
          letter-spacing: 0.2px;
        }
      </style>
    </head>
    <body>
      <div class="waybill-container">
        
        <!-- 1. Real-World SPX Structured Layout Header Grid -->
        <div class="spx-header">
          <div class="header-left-brand">FSTFY</div>
          
          <div class="header-mid-rts">
            <div class="rts-code">B-580-${regionalHubCode}-06</div>
            <div class="rts-label">RTS Sort Code:</div>
          </div>
          
          <div class="header-right-routing">
            <div class="routing-top-row">
              <div class="rt-box rt-divider">
                <div>06</div>
                <div class="rt-box-sub">F</div>
              </div>
              <div class="rt-box">R</div>
            </div>
            <div class="routing-mid-row">K-07-${localBranchCode}</div>
            <div class="routing-bottom-row">[H]</div>
          </div>
          
          <div class="header-far-right-anchor">${megaGatewayCode}</div>
        </div>

        <!-- 2. Order ID Reference Ribbon -->
        <div class="order-id-ribbon">
          Order ID: ${parcel?.externalOrderId || "230K1"}
        </div>

        <!-- 3. Fully Center-Aligned Vector Barcode Component -->
        <div class="barcode-section">
          <div class="barcode-wrapper">
            ${barcodeSvgHtml}
          </div>
          <div class="tracking-number-text">${trackingNumber}</div>
        </div>

        <!-- 4. Operational Dual Address Grid Section -->
        <table class="details-table">
          <thead>
            <tr>
              <th class="left-col">Seller</th>
              <th>Buyer</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="left-col">
                <div class="address-name">GadgetHub PH Warehouse</div>
                <div>Gumaoc West, City of San Jose Del Monte, Bulacan, North Luzon</div>
              </td>
              <td>
                <div class="address-name">David Jayson C. De Leon</div>
                <div>#31 Garnet Street, Phase 1-B, San Jose Del Monte City, Bulacan, North Luzon</div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- 5. Real-World Sector Hub Tracker Metrics -->
        <div class="sector-flow-row">
          <div class="sector-flow-cell">
            <div class="sector-flow-title">Province</div>
            <div class="sector-flow-value">Bulacan</div>
          </div>
          <div class="sector-flow-cell">
            <div class="sector-flow-title">City</div>
            <div class="sector-flow-value">San Jose Del...</div>
          </div>
          <div class="sector-flow-cell">
            <div class="sector-flow-title">Local Node</div>
            <div class="sector-flow-value">San Manuel</div>
          </div>
          <div class="sector-flow-cell">
            <div class="sector-flow-title">Postal Code</div>
            <div class="sector-flow-value">3023</div>
          </div>
        </div>

        <!-- 6. System Graph Inter-Hub Verification Footprint -->
        <div class="pipeline-map-footer">
          ROUTE: ${parcel?.routingPipelineCache || "Direct Sorting Delivery Network Line"}
        </div>

      </div>
    </body>
    </html>
      `)
  })

  // interface ParcelParams {
  //   parcelId: string;
  // }

  // interface ParcelOrderParams {
  //   externalOrderId: string;
  // }

  // fastify.patch<{ Params: ParcelOrderParams }>('/jnt/parcels/:externalOrderId/ready-for-pickup', {
  //   preHandler: [verifyLogisticsKey]
  // }, async (req, rep) => {
  //   const { externalOrderId } = req.params
  //   const description = generateEventDescription({ status: ShipmentStatus.ReadyForPickup })

  //   const data = await fastify.prisma.$transaction(async (tx) => {
  //     const updatedParcel = await tx.parcel.update({
  //       where: { externalOrderId: externalOrderId },
  //       data: { status: ShipmentStatus.ReadyForPickup }
  //     })

  //     await tx.trackingLog.create({
  //       data: {
  //         parcelId: updatedParcel.id,
  //         status: ShipmentStatus.ReadyForPickup,
  //         description
  //       }
  //     })

  //     return { updatedParcel }
  //   })

  //   rep.status(200).send({
  //     message: 'Parcel updated.',
  //     data: data.updatedParcel
  //   })
  // })

  // fastify.patch<{ Params: ParcelParams }>('/jnt/parcels/:parcelId/picked-up', {
  //   preHandler: [verifyUserAuth]
  // }, async (req, rep) => {
  //   const { parcelId } = req.params
  //   const parsedParcelId = parseInt(parcelId)
  //   const courier = req.user.courier

  //   const description = generateEventDescription({ status: ShipmentStatus.PickedUp, courierName: courier.firstName, plateNumber: courier.plateNumber })

  //   const data = await fastify.prisma.$transaction(async (tx) => {
  //     const updatedParcel = await tx.parcel.update({
  //       where: {
  //         id: parsedParcelId
  //       },
  //       data: {
  //         status: ShipmentStatus.PickedUp,
  //         currentFacilityId: courier.currentFacilityId,
  //         assignedCourierId: courier.id
  //       }
  //     })

  //     await tx.trackingLog.create({
  //       data: {
  //         parcelId: parsedParcelId,
  //         status: ShipmentStatus.PickedUp,
  //         description,
  //         facilityId: courier.currentFacilityId,
  //         courierId: courier.id
  //       }
  //     })

  //     return { updatedParcel }
  //   })

  //   const laravelWebhookUrl = process.env.LARAVEL_WEBHOOK_URL
  //   const webhookSecret = process.env.LOGISTICS_WEBHOOK_SECRET

  //   if (!laravelWebhookUrl || !webhookSecret) {
  //     console.error('Webhook configuration missing. Skipping dispatch')
  //     return;
  //   }

  //   const body = JSON.stringify({
  //     external_order_id: data.updatedParcel.externalOrderId,
  //     tracking_number: data.updatedParcel.trackingNumber,
  //     courier_id: courier.id,
  //     status: ShipmentStatus.PickedUp,
  //     description,
  //     timeStamp: data.updatedParcel.createdAt
  //   })

  //   // webhookHmacSignature
  //   const hmac = crypto.createHmac('sha256', webhookSecret);
  //   hmac.update(body)
  //   const signature = hmac.digest('hex')

  //   // webhookDispatch
  //   fetch(laravelWebhookUrl, {
  //     method: 'POST',
  //     headers: {
  //       'Content-Type': 'application/json',
  //       'X-Logistics-Signature': signature,
  //       'User-Agent': 'J&T EXpress',
  //     },
  //     body
  //   }).then(async (response) => {
  //     if (!response.ok) {
  //       const errorText = await response.text()
  //       console.error(`Laravel webhook failed with status [${response.status}]: ${errorText}`)
  //     }
  //   }).catch((error) => {
  //     console.error('Facility error during Laravel webhook dispatch: ', error)
  //   })

  //   rep.status(200).send({
  //     message: 'Parcel updated.',
  //     data: data.updatedParcel
  //   })
  // })

  // fastify.patch<{ Params: ParcelParams }>('/jnt/parcels/:parcelId/in-transit', {
  //   preHandler: [verifyUserAuth]
  // }, async (req, rep) => {
  //   const { parcelId } = req.params
  //   const parsedParcelId = parseInt(parcelId)
  //   const courier = req.user.courier
  //   const courierNetwork = await fastify.prisma.facility.findUniqueOrThrow({
  //     where: { id: courier.currentFacilityId },
  //   })

  //   const description = generateEventDescription({ status: ShipmentStatus.InTransit, originHub: courierNetwork.name, destinationHub: 'next hub' })

  //   const data = await fastify.prisma.$transaction(async (tx) => {
  //     const updatedParcel = await tx.parcel.update({
  //       where: {
  //         id: parsedParcelId
  //       },
  //       data: {
  //         status: ShipmentStatus.InTransit,
  //         currentFacilityId: courier.currentFacilityId,
  //         assignedCourierId: courier.id
  //       }
  //     })

  //     await tx.trackingLog.create({
  //       data: {
  //         parcelId: parsedParcelId,
  //         status: ShipmentStatus.InTransit,
  //         description,
  //         facilityId: courier.currentFacilityId,
  //         courierId: courier.id
  //       }
  //     })

  //     return { updatedParcel }
  //   })

  //   rep.status(200).send({
  //     message: 'Parcel updated.',
  //     data: data.updatedParcel
  //   })
  // })

  // fastify.patch<{ Params: ParcelParams }>('/jnt/parcels/:parcelId/arrived-at-hub', {
  //   preHandler: [verifyUserAuth]
  // }, async (req, rep) => {
  //   const { parcelId } = req.params
  //   const parsedParcelId = parseInt(parcelId)
  //   const courier = req.user.courier

  //   const description = generateEventDescription({ status: ShipmentStatus.ArrivedAtHub, hubName: 'unknown hub' })

  //   const data = await fastify.prisma.$transaction(async (tx) => {
  //     const updatedParcel = await tx.parcel.update({
  //       where: {
  //         id: parsedParcelId
  //       },
  //       data: {
  //         status: ShipmentStatus.ArrivedAtHub,
  //         currentFacilityId: courier.currentFacilityId,
  //         assignedCourierId: courier.id
  //       }
  //     })

  //     await tx.trackingLog.create({
  //       data: {
  //         parcelId: parsedParcelId,
  //         status: ShipmentStatus.ArrivedAtHub,
  //         description,
  //         facilityId: courier.currentFacilityId,
  //         courierId: courier.id
  //       }
  //     })

  //     return { updatedParcel }
  //   })

  //   rep.status(200).send({
  //     message: 'Parcel updated.',
  //     data: data.updatedParcel
  //   })
  // })

  // fastify.patch<{ Params: ParcelParams }>('/jnt/parcels/:parcelId/out-for-delivery', {
  //   preHandler: [verifyUserAuth]
  // }, async (req, rep) => {
  //   const { parcelId } = req.params
  //   const parsedParcelId = parseInt(parcelId)
  //   const courier = req.user.courier

  //   const description = generateEventDescription({ status: ShipmentStatus.OutForDelivery, courierName: courier.firstName })

  //   const data = await fastify.prisma.$transaction(async (tx) => {
  //     const updatedParcel = await tx.parcel.update({
  //       where: {
  //         id: parsedParcelId
  //       },
  //       data: {
  //         status: ShipmentStatus.OutForDelivery,
  //         currentFacilityId: courier.currentFacilityId,
  //         assignedCourierId: courier.id
  //       }
  //     })

  //     await tx.trackingLog.create({
  //       data: {
  //         parcelId: parsedParcelId,
  //         status: ShipmentStatus.OutForDelivery,
  //         description,
  //         facilityId: courier.currentFacilityId,
  //         courierId: courier.id
  //       }
  //     })

  //     return { updatedParcel }
  //   })

  //   rep.status(200).send({
  //     message: 'Parcel updated.',
  //     data: data.updatedParcel
  //   })
  // })

  // fastify.patch<{ Params: ParcelParams }>('/jnt/parcels/:parcelId/delivered', {
  //   preHandler: [verifyUserAuth]
  // }, async (req, rep) => {
  //   const { parcelId } = req.params
  //   const parsedParcelId = parseInt(parcelId)
  //   const courier = req.user.courier

  //   const description = generateEventDescription({ status: ShipmentStatus.Delivered })

  //   const data = await fastify.prisma.$transaction(async (tx) => {
  //     const updatedParcel = await tx.parcel.update({
  //       where: {
  //         id: parsedParcelId
  //       },
  //       data: {
  //         status: ShipmentStatus.Delivered,
  //         currentFacilityId: courier.currentFacilityId,
  //         assignedCourierId: courier.id
  //       }
  //     })

  //     await tx.trackingLog.create({
  //       data: {
  //         parcelId: parsedParcelId,
  //         status: ShipmentStatus.Delivered,
  //         description,
  //         facilityId: courier.currentFacilityId,
  //         courierId: courier.id
  //       }
  //     })

  //     return { updatedParcel }
  //   })

  //   const laravelWebhookUrl = process.env.LARAVEL_WEBHOOK_URL
  //   const webhookSecret = process.env.LOGISTICS_WEBHOOK_SECRET

  //   if (!laravelWebhookUrl || !webhookSecret) {
  //     console.error('Webhook configuration missing. Skipping dispatch')
  //     return;
  //   }

  //   const body = JSON.stringify({
  //     external_order_id: data.updatedParcel.externalOrderId,
  //     tracking_number: data.updatedParcel.trackingNumber,
  //     courier_id: courier.id,
  //     status: ShipmentStatus.Delivered,
  //     description,
  //     timeStamp: data.updatedParcel.createdAt
  //   })

  //   // webhookHmacSignature
  //   const hmac = crypto.createHmac('sha256', webhookSecret);
  //   hmac.update(body)
  //   const signature = hmac.digest('hex')

  //   // webhookDispatch
  //   fetch(laravelWebhookUrl, {
  //     method: 'POST',
  //     headers: {
  //       'Content-Type': 'application/json',
  //       'X-Logistics-Signature': signature,
  //       'User-Agent': 'J&T EXpress',
  //     },
  //     body
  //   }).then(async (response) => {
  //     if (!response.ok) {
  //       const errorText = await response.text()
  //       console.error(`Laravel webhook failed with status [${response.status}]: ${errorText}`)
  //     }
  //   }).catch((error) => {
  //     console.error('Facility error during Laravel webhook dispatch: ', error)
  //   })

  //   rep.status(200).send({
  //     message: 'Parcel updated.',
  //     data: data.updatedParcel
  //   })
  // })

  // fastify.patch<{ Params: ParcelParams }>('/jnt/parcels/:parcelId/rejected', {
  //   preHandler: [verifyLogisticsKey]
  // }, async (req, rep) => {
  //   const { parcelId } = req.params
  //   const parsedParcelId = parseInt(parcelId)
  //   const description = generateEventDescription({ status: ShipmentStatus.Rejected, reason: 'The last stock is broken.' })

  //   const data = await fastify.prisma.$transaction(async (tx) => {
  //     const updatedParcel = await tx.parcel.update({
  //       where: {
  //         id: parsedParcelId
  //       },
  //       data: {
  //         status: ShipmentStatus.Rejected
  //       }
  //     })

  //     await tx.trackingLog.create({
  //       data: {
  //         parcelId: parsedParcelId,
  //         status: ShipmentStatus.Rejected,
  //         description
  //       }
  //     })

  //     return { updatedParcel }
  //   })

  //   rep.status(200).send({
  //     message: 'Parcel updated.',
  //     data: data.updatedParcel
  //   })
  // })

  // interface ParcelAssignNetworkParams {
  //   parcelId: string;
  // }

  // interface ParcelAssignNetworkBody {
  //   facilityId: string
  // }

  // fastify.patch<{
  //   Body: ParcelAssignNetworkBody,
  //   Params: ParcelAssignNetworkParams
  // }>('/jnt/parcels/:parcelId/assign-facility', async (req, rep) => {
  //   const { facilityId } = req.body
  //   const parsedFacilityId = parseInt(facilityId)
  //   const { parcelId } = req.params
  //   const parsedParcelId = parseInt(parcelId)

  //   const updatedParcel = await fastify.prisma.parcel.update({
  //     where: {
  //       id: parsedParcelId
  //     },
  //     data: {
  //       currentFacilityId: parsedFacilityId
  //     },
  //     include: {
  //       currentFacility: true
  //     }
  //   })

  //   rep.status(200).send({
  //     message: "Facility assigned",
  //     data: updatedParcel
  //   })
  // })

  // interface ParcelAssignCourierParams {
  //   parcelId: string;
  // }

  // interface ParcelAssignCourierBody {
  //   courierId: string
  // }

  // fastify.patch<{
  //   Body: ParcelAssignCourierBody,
  //   Params: ParcelAssignCourierParams
  // }>('/jnt/parcels/:parcelId/assign-courier', async (req, rep) => {
  //   const { courierId } = req.body
  //   const parsedCourierId = parseInt(courierId)
  //   const { parcelId } = req.params
  //   const parsedParcelId = parseInt(parcelId)

  //   const updatedParcel = await fastify.prisma.parcel.update({
  //     where: {
  //       id: parsedParcelId
  //     },
  //     data: {
  //       assignedCourierId: parsedCourierId
  //     },
  //     include: {
  //       assignedCourier: true
  //     }
  //   })

  //   rep.status(200).send({
  //     message: "Courier assigned",
  //     data: updatedParcel
  //   })
  // })
}