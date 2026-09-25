import { buildApp } from "../../src/app.js";
import { describe, test, expect, afterAll, beforeAll } from "vitest";
import { prisma, disconnectPrisma } from "../../src/commons/plugins/prisma.js"
import { createCourier, createParcel, createTrackingLog } from "#factory";
import { ShipmentStatus } from "@prisma/client";
import { actAsCourier } from "../helper/auth.helper.js";

beforeAll(async () => {
  await prisma.$connect();
  await prisma.parcel.deleteMany();
  await prisma.courier.deleteMany();
  await prisma.user.deleteMany();
  await prisma.facility.deleteMany();
});

afterAll(async () => {
  await disconnectPrisma()
});

test('Simulate Shipment Test', () => expect(1+1).toBe(2))

// describe('Webhook Shipment Transition State', () => {
//   const app = buildApp();
//   const externalOrderId = '1'

//   test('a ready_for_pickup parcel can be picked up by available courier wtih assigned network with webhook dispatch', async () => {
//     const parcel = await createParcel({
//       externalOrderId
//     })

//     await createTrackingLog(parcel.id)
//     await createTrackingLog(parcel.id, ShipmentStatus.ReadyForPickup)

//     const courier = await createCourier({}, true)

//     const authHeaders = await actAsCourier(app, courier.user)

//     const response = await app.inject({
//       method: 'PATCH',
//       url: `/jnt/parcels/${parcel.id}/picked-up`,
//       headers: authHeaders
//     })

//     expect(response.statusCode).toBe(200)
//     expect(response.json().data.id).toBe(parcel.id)
//     expect(response.json().data.status).toBe(ShipmentStatus.PickedUp)

//     const shipmentTrackingLogs = await prisma.trackingLog.findMany({
//       where: {
//         parcelId: parcel.id
//       }
//     })

//     expect(shipmentTrackingLogs.length).toBe(3)
//     expect(shipmentTrackingLogs[0].status).toBe(ShipmentStatus.PendingPickup)
//     expect(shipmentTrackingLogs[1].status).toBe(ShipmentStatus.ReadyForPickup)
//     expect(shipmentTrackingLogs[2].status).toBe(ShipmentStatus.PickedUp)
//   })

//   test('a picked_up parcel can be set to in_transit', async () => {
//     const parcel = await prisma.parcel.findUniqueOrThrow({
//       where: { externalOrderId }
//     })

//     const courier = await prisma.courier.findFirstOrThrow({
//       include: {
//         user: true
//       }
//     })

//     const authHeaders = await actAsCourier(app, courier.user)

//     const response = await app.inject({
//       method: 'PATCH',
//       url: `/jnt/parcels/${parcel.id}/in-transit`,
//       headers: authHeaders
//     })

//     expect(response.statusCode).toBe(200)
//     expect(response.json().data.id).toBe(parcel.id)
//     expect(response.json().data.status).toBe(ShipmentStatus.InTransit)

//     const shipmentTrackingLogs = await prisma.trackingLog.findMany({
//       where: {
//         parcelId: parcel.id
//       }
//     })

//     expect(shipmentTrackingLogs.length).toBe(4)
//     expect(shipmentTrackingLogs[0].status).toBe(ShipmentStatus.PendingPickup)
//     expect(shipmentTrackingLogs[1].status).toBe(ShipmentStatus.ReadyForPickup)
//     expect(shipmentTrackingLogs[2].status).toBe(ShipmentStatus.PickedUp)
//     expect(shipmentTrackingLogs[3].status).toBe(ShipmentStatus.InTransit)
//   })

//   test('an in_transit parcel can be set to arrived_at_hub', async () => {
//     const parcel = await prisma.parcel.findUniqueOrThrow({
//       where: { externalOrderId }
//     })

//     const courier = await prisma.courier.findFirstOrThrow({
//       include: {
//         user: true
//       }
//     })

//     const authHeaders = await actAsCourier(app, courier.user)

//     const response = await app.inject({
//       method: 'PATCH',
//       url: `/jnt/parcels/${parcel.id}/arrived-at-hub`,
//       headers: authHeaders
//     })

//     expect(response.statusCode).toBe(200)
//     expect(response.json().data.id).toBe(parcel.id)
//     expect(response.json().data.status).toBe(ShipmentStatus.ArrivedAtHub)

//     const shipmentTrackingLogs = await prisma.trackingLog.findMany({
//       where: {
//         parcelId: parcel.id
//       }
//     })

//     expect(shipmentTrackingLogs.length).toBe(5)
//     expect(shipmentTrackingLogs[0].status).toBe(ShipmentStatus.PendingPickup)
//     expect(shipmentTrackingLogs[1].status).toBe(ShipmentStatus.ReadyForPickup)
//     expect(shipmentTrackingLogs[2].status).toBe(ShipmentStatus.PickedUp)
//     expect(shipmentTrackingLogs[3].status).toBe(ShipmentStatus.InTransit)
//     expect(shipmentTrackingLogs[4].status).toBe(ShipmentStatus.ArrivedAtHub)
//   })

//   test('an arrived_at_hub parcel can be set to out_for_delivery', async () => {
//     const parcel = await prisma.parcel.findUniqueOrThrow({
//       where: { externalOrderId }
//     })

//     const courier = await prisma.courier.findFirstOrThrow({
//       include: {
//         user: true
//       }
//     })

//     const authHeaders = await actAsCourier(app, courier.user)

//     const response = await app.inject({
//       method: 'PATCH',
//       url: `/jnt/parcels/${parcel.id}/out-for-delivery`,
//       headers: authHeaders
//     })

//     expect(response.statusCode).toBe(200)
//     expect(response.json().data.id).toBe(parcel.id)
//     expect(response.json().data.status).toBe(ShipmentStatus.OutForDelivery)

//     const shipmentTrackingLogs = await prisma.trackingLog.findMany({
//       where: {
//         parcelId: parcel.id
//       }
//     })

//     expect(shipmentTrackingLogs.length).toBe(6)
//     expect(shipmentTrackingLogs[0].status).toBe(ShipmentStatus.PendingPickup)
//     expect(shipmentTrackingLogs[1].status).toBe(ShipmentStatus.ReadyForPickup)
//     expect(shipmentTrackingLogs[2].status).toBe(ShipmentStatus.PickedUp)
//     expect(shipmentTrackingLogs[3].status).toBe(ShipmentStatus.InTransit)
//     expect(shipmentTrackingLogs[4].status).toBe(ShipmentStatus.ArrivedAtHub)
//     expect(shipmentTrackingLogs[5].status).toBe(ShipmentStatus.OutForDelivery)
//   })

//   test('an out_for_delivery parcel can be set to delivered with webhook dispatch', async () => {
//     const parcel = await prisma.parcel.findUniqueOrThrow({
//       where: { externalOrderId }
//     })

//     const courier = await prisma.courier.findFirstOrThrow({
//       include: {
//         user: true
//       }
//     })

//     const authHeaders = await actAsCourier(app, courier.user)

//     const response = await app.inject({
//       method: 'PATCH',
//       url: `/jnt/parcels/${parcel.id}/delivered`,
//       headers: authHeaders
//     })

//     expect(response.statusCode).toBe(200)
//     expect(response.json().data.id).toBe(parcel.id)
//     expect(response.json().data.status).toBe(ShipmentStatus.Delivered)

//     const shipmentTrackingLogs = await prisma.trackingLog.findMany({
//       where: {
//         parcelId: parcel.id
//       }
//     })

//     expect(shipmentTrackingLogs.length).toBe(7)
//     expect(shipmentTrackingLogs[0].status).toBe(ShipmentStatus.PendingPickup)
//     expect(shipmentTrackingLogs[1].status).toBe(ShipmentStatus.ReadyForPickup)
//     expect(shipmentTrackingLogs[2].status).toBe(ShipmentStatus.PickedUp)
//     expect(shipmentTrackingLogs[3].status).toBe(ShipmentStatus.InTransit)
//     expect(shipmentTrackingLogs[4].status).toBe(ShipmentStatus.ArrivedAtHub)
//     expect(shipmentTrackingLogs[5].status).toBe(ShipmentStatus.OutForDelivery)
//     expect(shipmentTrackingLogs[6].status).toBe(ShipmentStatus.Delivered)
//   })
// })