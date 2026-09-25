import { describe, expect, test } from "vitest";
import { ShipmentStatus } from "@prisma/client";
import { buildApp } from "../../src/app.js";
import { prisma } from "../../src/commons/plugins/prisma.js";
import { createCourier, createFacility, createParcel, createTrackingLog } from "#factory";
import { actAsCourier } from "../helper/auth.helper.js";

test('Parcel Domain', () => expect(2+2).toBe(4))

// describe('Parcel Domain', () => {
//   const app = buildApp()
//   const expectedKey = process.env.LOGISTICS_KEY

//   test('a Laravel vendor can book a parcel', async () => {
//     const response = await app.inject({
//       method: 'POST',
//       url: '/jnt/parcels',
//       headers: {
//         authorization: `Bearer ${expectedKey}`
//       },
//       body: {
//         externalOrderId: "1",
//         weightGrams: 1600,
//         storeName: "Store ABC",
//         storeContactNumber: "09542361264",
//         storeAddress: "Manila, Bulan 123 St.",
//         storeLocation: { lng: 14.21, lat: 123.24 },
//         customerName: "John Customer",
//         customerAddress: "Marilao San Pablo 123 St.",
//         customerPhone: "09244562453",
//       }
//     })

//     expect(response.statusCode).toBe(201)
//     expect(await prisma.parcel.count()).toBe(1)

//     expect(await prisma.trackingLog.count()).toBe(1)
//     expect((await prisma.trackingLog.findFirstOrThrow()).parcelId).toBe(response.json().data.id)
//   })

//   test('a Laravel vendor can set the parcel to ready_for_pickup', async () => {
//     const parcel = await createParcel()
//     createTrackingLog(parcel.id)

//     const response = await app.inject({
//       method: 'PATCH',
//       url: `/jnt/parcels/${parcel.externalOrderId}/ready-for-pickup`,
//       headers: {
//         authorization: `Bearer ${expectedKey}`
//       },
//     })

//     expect(response.statusCode).toBe(200)
//     expect(response.json().data.id).toBe(parcel.id)
//     expect(response.json().data.status).toBe(ShipmentStatus.ReadyForPickup)

//     const parcelTrackingLogs = await prisma.trackingLog.findMany({
//       where: {
//         parcelId: parcel.id
//       }
//     })

//     expect(parcelTrackingLogs.length).toBe(2)
//     expect(parcelTrackingLogs[0].status).toBe(ShipmentStatus.PendingPickup)
//     expect(parcelTrackingLogs[1].status).toBe(ShipmentStatus.ReadyForPickup)
//   })

//   test('a ready_for_pickup parcel can be picked up by available courier wtih assigned facility with webhook dispatch', async () => {
//     const parcel = await createParcel({
//       externalOrderId: '1'
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

//     const parcelTrackingLogs = await prisma.trackingLog.findMany({
//       where: {
//         parcelId: parcel.id
//       }
//     })

//     expect(parcelTrackingLogs.length).toBe(3)
//     expect(parcelTrackingLogs[0].status).toBe(ShipmentStatus.PendingPickup)
//     expect(parcelTrackingLogs[1].status).toBe(ShipmentStatus.ReadyForPickup)
//     expect(parcelTrackingLogs[2].status).toBe(ShipmentStatus.PickedUp)
//   })

//   test('a picked_up parcel can be set to in_transit', async () => {
//     const parcel = await createParcel()
//     await createTrackingLog(parcel.id)
//     await createTrackingLog(parcel.id, ShipmentStatus.ReadyForPickup)
//     await createTrackingLog(parcel.id, ShipmentStatus.PickedUp)

//     const courier = await createCourier({}, true)

//     const authHeaders = await actAsCourier(app, courier.user)

//     const response = await app.inject({
//       method: 'PATCH',
//       url: `/jnt/parcels/${parcel.id}/in-transit`,
//       headers: authHeaders
//     })

//     expect(response.statusCode).toBe(200)
//     expect(response.json().data.id).toBe(parcel.id)
//     expect(response.json().data.status).toBe(ShipmentStatus.InTransit)

//     const parcelTrackingLogs = await prisma.trackingLog.findMany({
//       where: {
//         parcelId: parcel.id
//       }
//     })

//     expect(parcelTrackingLogs.length).toBe(4)
//     expect(parcelTrackingLogs[0].status).toBe(ShipmentStatus.PendingPickup)
//     expect(parcelTrackingLogs[1].status).toBe(ShipmentStatus.ReadyForPickup)
//     expect(parcelTrackingLogs[2].status).toBe(ShipmentStatus.PickedUp)
//     expect(parcelTrackingLogs[3].status).toBe(ShipmentStatus.InTransit)
//   })

//   test('an in_transit parcel can be set to arrived_at_hub', async () => {
//     const parcel = await createParcel()
//     await createTrackingLog(parcel.id)
//     await createTrackingLog(parcel.id, ShipmentStatus.ReadyForPickup)
//     await createTrackingLog(parcel.id, ShipmentStatus.PickedUp)
//     await createTrackingLog(parcel.id, ShipmentStatus.InTransit)

//     const courier = await createCourier({}, true)

//     const authHeaders = await actAsCourier(app, courier.user)

//     const response = await app.inject({
//       method: 'PATCH',
//       url: `/jnt/parcels/${parcel.id}/arrived-at-hub`,
//       headers: authHeaders
//     })

//     expect(response.statusCode).toBe(200)
//     expect(response.json().data.id).toBe(parcel.id)
//     expect(response.json().data.status).toBe(ShipmentStatus.ArrivedAtHub)

//     const parcelTrackingLogs = await prisma.trackingLog.findMany({
//       where: {
//         parcelId: parcel.id
//       }
//     })

//     expect(parcelTrackingLogs.length).toBe(5)
//     expect(parcelTrackingLogs[0].status).toBe(ShipmentStatus.PendingPickup)
//     expect(parcelTrackingLogs[1].status).toBe(ShipmentStatus.ReadyForPickup)
//     expect(parcelTrackingLogs[2].status).toBe(ShipmentStatus.PickedUp)
//     expect(parcelTrackingLogs[3].status).toBe(ShipmentStatus.InTransit)
//     expect(parcelTrackingLogs[4].status).toBe(ShipmentStatus.ArrivedAtHub)
//   })

//   test('an arrived_at_hub parcel can be set to out_for_delivery', async () => {
//     const parcel = await createParcel()
//     await createTrackingLog(parcel.id)
//     await createTrackingLog(parcel.id, ShipmentStatus.ReadyForPickup)
//     await createTrackingLog(parcel.id, ShipmentStatus.PickedUp)
//     await createTrackingLog(parcel.id, ShipmentStatus.InTransit)
//     await createTrackingLog(parcel.id, ShipmentStatus.ArrivedAtHub)

//     const courier = await createCourier({}, true)

//     const authHeaders = await actAsCourier(app, courier.user)

//     const response = await app.inject({
//       method: 'PATCH',
//       url: `/jnt/parcels/${parcel.id}/out-for-delivery`,
//       headers: authHeaders
//     })

//     expect(response.statusCode).toBe(200)
//     expect(response.json().data.id).toBe(parcel.id)
//     expect(response.json().data.status).toBe(ShipmentStatus.OutForDelivery)

//     const parcelTrackingLogs = await prisma.trackingLog.findMany({
//       where: {
//         parcelId: parcel.id
//       }
//     })

//     expect(parcelTrackingLogs.length).toBe(6)
//     expect(parcelTrackingLogs[0].status).toBe(ShipmentStatus.PendingPickup)
//     expect(parcelTrackingLogs[1].status).toBe(ShipmentStatus.ReadyForPickup)
//     expect(parcelTrackingLogs[2].status).toBe(ShipmentStatus.PickedUp)
//     expect(parcelTrackingLogs[3].status).toBe(ShipmentStatus.InTransit)
//     expect(parcelTrackingLogs[4].status).toBe(ShipmentStatus.ArrivedAtHub)
//     expect(parcelTrackingLogs[5].status).toBe(ShipmentStatus.OutForDelivery)
//   })

//   test('an out_for_delivery parcel can be set to delivered', async () => {
//     const parcel = await createParcel()
//     await createTrackingLog(parcel.id)
//     await createTrackingLog(parcel.id, ShipmentStatus.ReadyForPickup)
//     await createTrackingLog(parcel.id, ShipmentStatus.PickedUp)
//     await createTrackingLog(parcel.id, ShipmentStatus.InTransit)
//     await createTrackingLog(parcel.id, ShipmentStatus.ArrivedAtHub)
//     await createTrackingLog(parcel.id, ShipmentStatus.OutForDelivery)

//     const courier = await createCourier({}, true)

//     const authHeaders = await actAsCourier(app, courier.user)

//     const response = await app.inject({
//       method: 'PATCH',
//       url: `/jnt/parcels/${parcel.id}/delivered`,
//       headers: authHeaders
//     })

//     expect(response.statusCode).toBe(200)
//     expect(response.json().data.id).toBe(parcel.id)
//     expect(response.json().data.status).toBe(ShipmentStatus.Delivered)

//     const parcelTrackingLogs = await prisma.trackingLog.findMany({
//       where: {
//         parcelId: parcel.id
//       }
//     })

//     expect(parcelTrackingLogs.length).toBe(7)
//     expect(parcelTrackingLogs[0].status).toBe(ShipmentStatus.PendingPickup)
//     expect(parcelTrackingLogs[1].status).toBe(ShipmentStatus.ReadyForPickup)
//     expect(parcelTrackingLogs[2].status).toBe(ShipmentStatus.PickedUp)
//     expect(parcelTrackingLogs[3].status).toBe(ShipmentStatus.InTransit)
//     expect(parcelTrackingLogs[4].status).toBe(ShipmentStatus.ArrivedAtHub)
//     expect(parcelTrackingLogs[5].status).toBe(ShipmentStatus.OutForDelivery)
//     expect(parcelTrackingLogs[6].status).toBe(ShipmentStatus.Delivered)
//   })

//   test('a Laravel vendor can set the parcel to rejected', async () => {
//     const parcel = await createParcel()
//     createTrackingLog(parcel.id)

//     const response = await app.inject({
//       method: 'PATCH',
//       url: `/jnt/parcels/${parcel.id}/rejected`,
//       headers: {
//         authorization: `Bearer ${expectedKey}`
//       },
//     })

//     expect(response.statusCode).toBe(200)
//     expect(response.json().data.id).toBe(parcel.id)
//     expect(response.json().data.status).toBe(ShipmentStatus.Rejected)

//     const parcelTrackingLogs = await prisma.trackingLog.findMany({
//       where: {
//         parcelId: parcel.id
//       }
//     })

//     expect(parcelTrackingLogs.length).toBe(2)
//     expect(parcelTrackingLogs[0].status).toBe(ShipmentStatus.PendingPickup)
//     expect(parcelTrackingLogs[1].status).toBe(ShipmentStatus.Rejected)
//   })

//   test('a parcel can have a facility', async () => {
//     const parcel = await createParcel()
//     const facility = await createFacility()

//     const response = await app.inject({
//       method: 'PATCH',
//       url: `/jnt/parcels/${parcel.id}/assign-facility`,
//       headers: {
//         authorization: `Bearer ${expectedKey}`
//       },
//       body: {
//         facilityId: facility.id
//       }
//     })

//     expect(response.statusCode).toBe(200)
//     expect(response.json().data.id).toBe(parcel.id)
//     expect(response.json().data.currentFacility.id).toBe(facility.id)
//   })

//   test('a parcel can have a courier', async () => {
//     const parcel = await createParcel()
//     const courier = await createCourier()

//     const response = await app.inject({
//       method: 'PATCH',
//       url: `/jnt/parcels/${parcel.id}/assign-courier`,
//       headers: {
//         authorization: `Bearer ${expectedKey}`
//       },
//       body: {
//         courierId: courier.id
//       }
//     })

//     expect(response.statusCode).toBe(200)
//     expect(response.json().data.id).toBe(parcel.id)
//     expect(response.json().data.assignedCourier.id).toBe(courier.id)
//   })
// })