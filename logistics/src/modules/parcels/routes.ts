import { FastifyInstance } from "fastify";
import { StoreBody, StoreSchema } from "./schema.js";
import { createParcel } from "./service.js";
import { ShipmentStatus } from "@prisma/client";
import { createTrackingLog } from "../tracking-logs/service.js";
import parcelAuth from "#commons/middlewares/client-auth.js";
import { activateTrackingNumber } from "../tracking-numbers/service.js";

export default async function parcelRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: StoreBody }>(StoreSchema.url, {
    schema: StoreSchema,
    preHandler: [parcelAuth]
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
      message: 'Parcel created.',
      data: parcel
    })
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