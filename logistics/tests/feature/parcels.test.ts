import { API_ROUTES } from "#commons/constants/routes.js";
import { FacilityType, ShipmentStatus, TransitMode } from "@prisma/client";
import { FastifyInstance } from "fastify";
import { beforeAll, describe, expect, test } from "vitest";
import { createClient } from "../factory/client.factory.js";
import { generateTrackingNumbers } from "../../src/modules/tracking-numbers/service.js";
import { calculateDigest, decryptSecret } from "#commons/utils/crypto.js";
import { seedFacilities } from "../../prisma/seeders/facilities.seed.js";
import { seedGeo } from "../../prisma/seeders/tests/geographic-areas.seed.js";
import { seedMasterInfrustructure } from "../../prisma/seeders/tests/master-infrastructure-tests.seed.js";

describe('Parcel Domain', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = (globalThis as any).app as FastifyInstance
  })

  const expectedKey = process.env.LOGISTICS_KEY

  test.only('a Laravel vendor can book a parcel', async () => {
    await seedMasterInfrustructure(app)

    const client = await createClient({
      apiKey: 'apk_99faa7f6c27c0c382d94182c5f3727d9',
      apiSecret: '6fbe5fdbbf51a044cec3a396:f2a52895dd162b6c9c4832a86bf3c360:d963793640fd69acdcde62bf362369eafd24aeb712e68730eba681b3e94a8b3b3c9d74727fe2581ba55e6f021151ed453a4cf50b7a255a77064e1da7fc6aadd2'
    })
    // console.log(client)

    const trackingNumber = (await generateTrackingNumbers({
      apiKey: client.apiKey,
      size: 1
    }))[0].trackingNumber

    // await app.prisma.megaGateway.createMany({
    //   data: [
    //     { id: 1, name: "NCR Sorting Gateway Clark", coverageCode: "R01", code: "GW-R01-01", address: "123 ABC St." },
    //     { id: 2, name: "North Luzon Expressway Gateway Bocaue", coverageCode: "R03", code: "GW-NL-01", address: "123 ABC St." },
    //     { id: 3, name: "South Luzon Expressway Gateway Calamba", coverageCode: "R4A", code: "GW-SL-01", address: "123 ABC St." },
    //   ],
    //   skipDuplicates: true
    // });

    // await app.prisma.distributionCenter.createMany({
    //   data: [
    //     { id: 1, name: "Caloocan District Central DC", coverageCode: "NCR-CAL", code: "DC-NCR-CAL-01", megaGatewayId: 1, address: "456 DEF St." },
    //     { id: 2, name: "Bulacan Provincial DC (Marilao)", coverageCode: "R03-BUL", code: "DC-R03-BUL-01", megaGatewayId: 2, address: "456 DEF St." },
    //     { id: 3, name: "Cavite Provincial DC (Dasmariñas)", coverageCode: "R4A-CAV", code: "DC-R4A-CAV-01", megaGatewayId: 3, address: "456 DEF St." },
    //     { id: 4, name: "Urdaneta DC", coverageCode: "R01-PAN", code: "DC-01-PAN-01", megaGatewayId: 1, address: "456 DEF St." },
    //   ],
    //   skipDuplicates: true
    // });

    // const urdanetaDC = await app.prisma.distributionCenter.create({
    //   data: {
    //     name: "Urdaneta DC",
    //     coverageCode: "R01-PAN",
    //     code: "DC-01-PAN-01",
    //     megaGatewayId: 1,
    //     address: "456 DEF St."
    //   },
    // });

    // await app.prisma.localBranch.createMany({
    //   data: [
    //     {
    //       id: 1,
    //       name: "Caloocan South Branch Delivery Hub",
    //       coverageCode: "NCR-CAL-CAL",
    //       code: "BR-CAL-01",
    //       distributionCenterId: 1,
    //       address: "789 GHI St."
    //     },
    //     {
    //       id: 2,
    //       name: "San Jose Del Monte Delivery Hub",
    //       coverageCode: "R03-BUL-SJD",
    //       code: "BR-BUL-SJD-01",
    //       distributionCenterId: 2,
    //       address: "789 GHI St."
    //     },
    //     {
    //       id: 3,
    //       name: "Dasmariñas City Delivery Hub",
    //       coverageCode: "R4A-CAV-DAS",
    //       code: "BR-CAV-DAS-01",
    //       distributionCenterId: 3,
    //       address: "789 GHI St."
    //     }
    //   ],
    //   skipDuplicates: true
    // });

    const rawBodyString = JSON.stringify({
      merchant_details: {
        name: 'Johnny Dee',
        shop_name: 'Manila Mega Store',
        contact_number: '09112233445',
        pickup_address: {
          region: 'National Capital Region (NCR)',
          province: null, // NCR has no province in PSGC
          city: 'Parañaque',
          barangay: 'Baclaran', // "NCR-MET-PAR-S01" (1381000001)
          full_address: '659 A. Antonio Villegas St, Ermita, Manila, 1000 Metro Manila, Philippines',
          coordinates: {
            longitude: 120.987694,
            latitude: 14.5290214,
          },
        },
      },
      customer_details: {
        name: 'Jane Doe',
        contact_number: '09123456789',
        email: 'jane.doe@example.com',
        delivery_address: {
          region: 'National Capital Region (NCR)',
          province: null,
          city: 'Marikina City',
          barangay: 'Barangka', // "NCR-MET-MAR-S01" (1380700001)
          full_address: 'Sumulong Highway cor. Shoe Avenue, Barangay Barangka, Marikina City',
          coordinates: {
            longitude: 121.0821662,
            latitude: 14.6327812,
          },
        },
      },
      parcel_info: {
        weight_grams: 1500,
        length_cm: 25.5,
        width_cm: 15.0,
        height_cm: 10.0,
        item_description: 'Wireless Mechanical Keyboard',
        declared_value: 2500.00,
      },
      order_info: {
        order_id: 'ORD-2026-00123',
        tracking_number: trackingNumber,
        service_type: 'regular',
        payment_method: 'online',
      },
    })
    const plainTextSecret = decryptSecret(client.apiSecret)
    const signature = calculateDigest(rawBodyString, plainTextSecret)

    // console.log({ rawBodyString })
    // console.log({ signature })

    const response = await app.inject({
      method: 'POST',
      url: API_ROUTES.parcels.store,
      headers: {
        'x-api-key': client.apiKey,
        'x-signature': signature,
        'content-type': 'application/json',
      },
      body: rawBodyString
    })

    const data = response.json().data
    console.log(response.json())
    
    const trackingNumberData = await app.prisma.trackingNumberPool.findFirstOrThrow({
      where: { trackingNumber: data.tracking_number },
      include: {
        parcel: true
      }
    })

    expect(trackingNumberData.isAssigned).toBe(true)
    expect(trackingNumberData.clientId).toBe(client.id)

    const parcel = trackingNumberData.parcel
    expect((parcel as any).status).toBe(ShipmentStatus.ReadyForPickup)

    expect(response.statusCode).toBe(201)
    expect(await app.prisma.parcel.count()).toBe(1)
    expect(await app.prisma.trackingLog.count()).toBe(1)
  }, 60000)

  test.skip('intra-sector booking is not allowed', async () => {

  })

  // test.only('a Laravel vendor can download a waybill', async () => {
  //   const response = app.inject({
  //     method: 'GET',
  //     url: API_ROUTES.parcels.waybill
  //   })
  // })

  // test('a Laravel vendor can set the parcel to ready_for_pickup', async () => {
  //   const parcel = await createParcel()
  //   createTrackingLog(parcel.id)

  //   const response = await app.inject({
  //     method: 'PATCH',
  //     url: `/ jnt / parcels / ${ parcel.externalOrderId } / ready -for-pickup`,
  //     headers: {
  //       authorization: `Bearer ${ expectedKey } `
  //     },
  //   })

  //   expect(response.statusCode).toBe(200)
  //   expect(response.json().data.id).toBe(parcel.id)
  //   expect(response.json().data.status).toBe(ShipmentStatus.ReadyForPickup)

  //   const parcelTrackingLogs = await prisma.trackingLog.findMany({
  //     where: {
  //       parcelId: parcel.id
  //     }
  //   })

  //   expect(parcelTrackingLogs.length).toBe(2)
  //   expect(parcelTrackingLogs[0].status).toBe(ShipmentStatus.PendingPickup)
  //   expect(parcelTrackingLogs[1].status).toBe(ShipmentStatus.ReadyForPickup)
  // })

  // test('a ready_for_pickup parcel can be picked up by available courier wtih assigned facility with webhook dispatch', async () => {
  //   const parcel = await createParcel({
  //     externalOrderId: '1'
  //   })
  //   await createTrackingLog(parcel.id)
  //   await createTrackingLog(parcel.id, ShipmentStatus.ReadyForPickup)

  //   const courier = await createCourier({}, true)

  //   const authHeaders = await actAsCourier(app, courier.user)

  //   const response = await app.inject({
  //     method: 'PATCH',
  //     url: `/ jnt / parcels / ${ parcel.id }/picked-up`,
  //     headers: authHeaders
  //   })

  //   expect(response.statusCode).toBe(200)
  //   expect(response.json().data.id).toBe(parcel.id)
  //   expect(response.json().data.status).toBe(ShipmentStatus.PickedUp)

  //   const parcelTrackingLogs = await prisma.trackingLog.findMany({
  //     where: {
  //       parcelId: parcel.id
  //     }
  //   })

  //   expect(parcelTrackingLogs.length).toBe(3)
  //   expect(parcelTrackingLogs[0].status).toBe(ShipmentStatus.PendingPickup)
  //   expect(parcelTrackingLogs[1].status).toBe(ShipmentStatus.ReadyForPickup)
  //   expect(parcelTrackingLogs[2].status).toBe(ShipmentStatus.PickedUp)
  // })

  // test('a picked_up parcel can be set to in_transit', async () => {
  //   const parcel = await createParcel()
  //   await createTrackingLog(parcel.id)
  //   await createTrackingLog(parcel.id, ShipmentStatus.ReadyForPickup)
  //   await createTrackingLog(parcel.id, ShipmentStatus.PickedUp)

  //   const courier = await createCourier({}, true)

  //   const authHeaders = await actAsCourier(app, courier.user)

  //   const response = await app.inject({
  //     method: 'PATCH',
  //     url: `/jnt/parcels/${parcel.id}/in-transit`,
  //     headers: authHeaders
  //   })

  //   expect(response.statusCode).toBe(200)
  //   expect(response.json().data.id).toBe(parcel.id)
  //   expect(response.json().data.status).toBe(ShipmentStatus.InTransit)

  //   const parcelTrackingLogs = await prisma.trackingLog.findMany({
  //     where: {
  //       parcelId: parcel.id
  //     }
  //   })

  //   expect(parcelTrackingLogs.length).toBe(4)
  //   expect(parcelTrackingLogs[0].status).toBe(ShipmentStatus.PendingPickup)
  //   expect(parcelTrackingLogs[1].status).toBe(ShipmentStatus.ReadyForPickup)
  //   expect(parcelTrackingLogs[2].status).toBe(ShipmentStatus.PickedUp)
  //   expect(parcelTrackingLogs[3].status).toBe(ShipmentStatus.InTransit)
  // })

  // test('an in_transit parcel can be set to arrived_at_hub', async () => {
  //   const parcel = await createParcel()
  //   await createTrackingLog(parcel.id)
  //   await createTrackingLog(parcel.id, ShipmentStatus.ReadyForPickup)
  //   await createTrackingLog(parcel.id, ShipmentStatus.PickedUp)
  //   await createTrackingLog(parcel.id, ShipmentStatus.InTransit)

  //   const courier = await createCourier({}, true)

  //   const authHeaders = await actAsCourier(app, courier.user)

  //   const response = await app.inject({
  //     method: 'PATCH',
  //     url: `/jnt/parcels/${parcel.id}/arrived-at-hub`,
  //     headers: authHeaders
  //   })

  //   expect(response.statusCode).toBe(200)
  //   expect(response.json().data.id).toBe(parcel.id)
  //   expect(response.json().data.status).toBe(ShipmentStatus.ArrivedAtHub)

  //   const parcelTrackingLogs = await prisma.trackingLog.findMany({
  //     where: {
  //       parcelId: parcel.id
  //     }
  //   })

  //   expect(parcelTrackingLogs.length).toBe(5)
  //   expect(parcelTrackingLogs[0].status).toBe(ShipmentStatus.PendingPickup)
  //   expect(parcelTrackingLogs[1].status).toBe(ShipmentStatus.ReadyForPickup)
  //   expect(parcelTrackingLogs[2].status).toBe(ShipmentStatus.PickedUp)
  //   expect(parcelTrackingLogs[3].status).toBe(ShipmentStatus.InTransit)
  //   expect(parcelTrackingLogs[4].status).toBe(ShipmentStatus.ArrivedAtHub)
  // })

  // test('an arrived_at_hub parcel can be set to out_for_delivery', async () => {
  //   const parcel = await createParcel()
  //   await createTrackingLog(parcel.id)
  //   await createTrackingLog(parcel.id, ShipmentStatus.ReadyForPickup)
  //   await createTrackingLog(parcel.id, ShipmentStatus.PickedUp)
  //   await createTrackingLog(parcel.id, ShipmentStatus.InTransit)
  //   await createTrackingLog(parcel.id, ShipmentStatus.ArrivedAtHub)

  //   const courier = await createCourier({}, true)

  //   const authHeaders = await actAsCourier(app, courier.user)

  //   const response = await app.inject({
  //     method: 'PATCH',
  //     url: `/jnt/parcels/${parcel.id}/out-for-delivery`,
  //     headers: authHeaders
  //   })

  //   expect(response.statusCode).toBe(200)
  //   expect(response.json().data.id).toBe(parcel.id)
  //   expect(response.json().data.status).toBe(ShipmentStatus.OutForDelivery)

  //   const parcelTrackingLogs = await prisma.trackingLog.findMany({
  //     where: {
  //       parcelId: parcel.id
  //     }
  //   })

  //   expect(parcelTrackingLogs.length).toBe(6)
  //   expect(parcelTrackingLogs[0].status).toBe(ShipmentStatus.PendingPickup)
  //   expect(parcelTrackingLogs[1].status).toBe(ShipmentStatus.ReadyForPickup)
  //   expect(parcelTrackingLogs[2].status).toBe(ShipmentStatus.PickedUp)
  //   expect(parcelTrackingLogs[3].status).toBe(ShipmentStatus.InTransit)
  //   expect(parcelTrackingLogs[4].status).toBe(ShipmentStatus.ArrivedAtHub)
  //   expect(parcelTrackingLogs[5].status).toBe(ShipmentStatus.OutForDelivery)
  // })

  // test('an out_for_delivery parcel can be set to delivered', async () => {
  //   const parcel = await createParcel()
  //   await createTrackingLog(parcel.id)
  //   await createTrackingLog(parcel.id, ShipmentStatus.ReadyForPickup)
  //   await createTrackingLog(parcel.id, ShipmentStatus.PickedUp)
  //   await createTrackingLog(parcel.id, ShipmentStatus.InTransit)
  //   await createTrackingLog(parcel.id, ShipmentStatus.ArrivedAtHub)
  //   await createTrackingLog(parcel.id, ShipmentStatus.OutForDelivery)

  //   const courier = await createCourier({}, true)

  //   const authHeaders = await actAsCourier(app, courier.user)

  //   const response = await app.inject({
  //     method: 'PATCH',
  //     url: `/jnt/parcels/${parcel.id}/delivered`,
  //     headers: authHeaders
  //   })

  //   expect(response.statusCode).toBe(200)
  //   expect(response.json().data.id).toBe(parcel.id)
  //   expect(response.json().data.status).toBe(ShipmentStatus.Delivered)

  //   const parcelTrackingLogs = await prisma.trackingLog.findMany({
  //     where: {
  //       parcelId: parcel.id
  //     }
  //   })

  //   expect(parcelTrackingLogs.length).toBe(7)
  //   expect(parcelTrackingLogs[0].status).toBe(ShipmentStatus.PendingPickup)
  //   expect(parcelTrackingLogs[1].status).toBe(ShipmentStatus.ReadyForPickup)
  //   expect(parcelTrackingLogs[2].status).toBe(ShipmentStatus.PickedUp)
  //   expect(parcelTrackingLogs[3].status).toBe(ShipmentStatus.InTransit)
  //   expect(parcelTrackingLogs[4].status).toBe(ShipmentStatus.ArrivedAtHub)
  //   expect(parcelTrackingLogs[5].status).toBe(ShipmentStatus.OutForDelivery)
  //   expect(parcelTrackingLogs[6].status).toBe(ShipmentStatus.Delivered)
  // })

  // test('a Laravel vendor can set the parcel to rejected', async () => {
  //   const parcel = await createParcel()
  //   createTrackingLog(parcel.id)

  //   const response = await app.inject({
  //     method: 'PATCH',
  //     url: `/jnt/parcels/${parcel.id}/rejected`,
  //     headers: {
  //       authorization: `Bearer ${expectedKey}`
  //     },
  //   })

  //   expect(response.statusCode).toBe(200)
  //   expect(response.json().data.id).toBe(parcel.id)
  //   expect(response.json().data.status).toBe(ShipmentStatus.Rejected)

  //   const parcelTrackingLogs = await prisma.trackingLog.findMany({
  //     where: {
  //       parcelId: parcel.id
  //     }
  //   })

  //   expect(parcelTrackingLogs.length).toBe(2)
  //   expect(parcelTrackingLogs[0].status).toBe(ShipmentStatus.PendingPickup)
  //   expect(parcelTrackingLogs[1].status).toBe(ShipmentStatus.Rejected)
  // })

  // test('a parcel can have a facility', async () => {
  //   const parcel = await createParcel()
  //   const facility = await createFacility()

  //   const response = await app.inject({
  //     method: 'PATCH',
  //     url: `/jnt/parcels/${parcel.id}/assign-facility`,
  //     headers: {
  //       authorization: `Bearer ${expectedKey}`
  //     },
  //     body: {
  //       facilityId: facility.id
  //     }
  //   })

  //   expect(response.statusCode).toBe(200)
  //   expect(response.json().data.id).toBe(parcel.id)
  //   expect(response.json().data.currentFacility.id).toBe(facility.id)
  // })

  // test('a parcel can have a courier', async () => {
  //   const parcel = await createParcel()
  //   const courier = await createCourier()

  //   const response = await app.inject({
  //     method: 'PATCH',
  //     url: `/jnt/parcels/${parcel.id}/assign-courier`,
  //     headers: {
  //       authorization: `Bearer ${expectedKey}`
  //     },
  //     body: {
  //       courierId: courier.id
  //     }
  //   })

  //   expect(response.statusCode).toBe(200)
  //   expect(response.json().data.id).toBe(parcel.id)
  //   expect(response.json().data.assignedCourier.id).toBe(courier.id)
  // })
})