import { API_ROUTES } from "#commons/constants/routes.js";
import { createFacility } from "#factory";
import { FacilityType, ShipmentStatus } from "@prisma/client";
import { PrismaClient } from "@prisma/client/extension";
import { FastifyInstance } from "fastify";
import { beforeAll, describe, expect, test } from "vitest";
import { createClient } from "../factory/client.factory.js";
import { generateTrackingNumbers } from "../../src/modules/tracking-numbers/service.js";
import { calculateDigest, decryptSecret } from "#commons/utils/crypto.js";

describe('Parcel Domain', () => {
  let app: FastifyInstance

  beforeAll(() => {
    app = (globalThis as any).app as FastifyInstance
  })

  const expectedKey = process.env.LOGISTICS_KEY

  test.only('a Laravel vendor can book a parcel', async () => {
    const randomSuffix = Math.floor(Math.random() * 10000);

    const client = await createClient({
      apiKey: 'apk_99faa7f6c27c0c382d94182c5f3727d9',
      apiSecret: '6fbe5fdbbf51a044cec3a396:f2a52895dd162b6c9c4832a86bf3c360:d963793640fd69acdcde62bf362369eafd24aeb712e68730eba681b3e94a8b3b3c9d74727fe2581ba55e6f021151ed453a4cf50b7a255a77064e1da7fc6aadd2'
    })
    console.log(client)

    const trackingNumbers = await generateTrackingNumbers({
      clientId: client.id,
      size: 5
    })
    const trackingNumber = trackingNumbers[0].trackingNumber

    console.log(trackingNumbers)

    /**
     * THIS IS WHERE WE GONNA BUILD THE GRAPH
     * - focus on Luzon first.
     * - each facility should have a code based on their type
     */
    // Root Node (tier 1) - First Mega Gateway in Luzon
    const centralGateway = await createFacility({
      name: "Valenzuela Central Mega Gateway",
      type: FacilityType.MegaGateway,
      sortingCode: "GW-VAL-01",
      address: "Maysan, Valenzuela City, Metro Manila",
    })

    // Branch Node (tier 2)
    const bulacanHub = await createFacility({
      name: "Marilao Bulacan Regional Hub",
      type: FacilityType.RegionalHub,
      sortingCode: "HUB-BUL-01",
      address: "McArthur Highway, Marilao, Bulacan",
      parentId: centralGateway.id
    })

    // Branch Node (tier 2)
    const ncrHub = await createFacility({
      name: "Caloocan South NCR Regional Hub",
      type: FacilityType.RegionalHub,
      sortingCode: "HUB-NCR-01",
      address: "5th Ave, Caloocan City, Metro Manila",
      parentId: centralGateway.id
    })

    // Branch Node (tier 3)
    const sjdmBranch = await createFacility({
      name: "SJDM Local Branch",
      type: FacilityType.LocalBranch,
      sortingCode: "BR-SJDM-01",
      address: "San Manuel, City of San Jose Del Monte, Bulacan",
      parentId: bulacanHub.id
    })

    // Branch Node (tier 3)
    const qcBranch = await createFacility({
      name: "Quezon City Pinyahan Local Branch",
      type: FacilityType.LocalBranch,
      sortingCode: "BR-QC-01",
      address: "Barangay Pinyahan, Diliman, Quezon City",
      parentId: ncrHub.id
    })

    const customerLocation = {
      region: 'Central Luzon',
      province: 'Bulacan',
      city: 'City of San Jose Del Monte',
      barangay: 'San Manuel',
      full_address: 'Bulacan, City of San Jose Del Monte, San Manuel, Garnet Street',
      coordinates: {
        longitude: '121.0468066',
        latitude: '14.6411298',
      },
    }
    const warehouseLocation = [{
      region: 'Metro Manila',
      province: 'Metro Manila',
      city: 'Quezon City',
      barangay: 'Pinyahan',
      full_address: 'Garnet Street, Barangay Pinyahan, Diliman, Quezon City, Metro Manila',
      coordinates: {
        longitude: '121.0673907',
        latitude: '14.7787567',
      },
    }]




    // The branch that will pick up the parcel from the warehouse at Diliman QC
    const originFacilityAuroraBoulevard = await createFacility({
      name: "Aurora Boulevard Local Branch " + randomSuffix,
      type: FacilityType.LocalBranch,
      longitude: 121.0586245,
      latitude: 14.6257263,
      // parentId remember a local branch should have a lineage
    })
    console.log(originFacilityAuroraBoulevard)
    const auroraBoulevardPolygon = JSON.stringify({
      type: "Polygon",
      coordinates: [
        [
          [
            121.0577246,
            14.6605988
          ],
          [
            121.0206009,
            14.6643069
          ],
          [
            121.0150172,
            14.6354914
          ],
          [
            121.0456469,
            14.6141561
          ],
          [
            121.0796352,
            14.6145305
          ],
          [
            121.0866494,
            14.6403207
          ],
          [
            121.0577246,
            14.6605988
          ]
        ]
      ]
    });
    const [originBoundary] = await app.prisma.$queryRaw<any[]>`
      INSERT INTO "delivery_boundaries" (
        "facility_id",
        "delivery_area"
      ) VALUES (
        ${originFacilityAuroraBoulevard.id},
        ST_GeomFromGeoJSON(${auroraBoulevardPolygon})
      )
      RETURNING *;
    `
    console.log(originBoundary)

    const destinationFacilityGumaoc = await createFacility({
      name: "Gumaoc Local Branch" + randomSuffix,
      type: FacilityType.LocalBranch,
      longitude: 121.0642626,
      latitude: 14.7998613,
    })
    console.log(destinationFacilityGumaoc)

    const rawBodyString = JSON.stringify({
      merchant_details: {
        name: 'Gadget Hub PH',
        contact_number: '+639171234567',
        pickup_address: {
          region: 'Central Luzon',
          province: 'Bulacan',
          city: 'City of San Jose Del Monte',
          barangay: 'San Manuel',
          full_address: 'Bulacan, City of San Jose Del Monte, San Manuel, Garnet Street',
          coordinates: {
            longitude: '121.0468066',
            latitude: '14.6411298',
          },
        },
      },
      customer_details: {
        name: 'John Doe',
        contact_number: '+639646875348',
        email: 'johndoe@email.com',
        delivery_address: {
          region: 'Metro Manila',
          province: 'Metro Manila',
          city: 'Quezon City',
          barangay: 'Pinyahan',
          full_address: 'Garnet Street, Barangay Pinyahan, Diliman, Quezon City, Metro Manila',
          coordinates: {
            longitude: '121.0673907',
            latitude: '14.7787567',
          },
        },
      },
      parcel_info: {
        weight_grams: 1200,
        length_cm: 20.0,
        width_cm: 15.0,
        height_cm: 10.0,
        item_description: 'Wireless Mechanical Keyboard',
        declared_value: 1250.00,
      },
      order_info: {
        order_id: '1',
        tracking_number: trackingNumber,
        service_type: 'Standard Delivery',
        payment_method: 'online',
        cod_amount: 1250.00,
        currency: 'PHP',
      },
    })
    const plainTextSecret = decryptSecret(client.apiSecret)
    const signature = calculateDigest(rawBodyString, plainTextSecret)

    console.log({ rawBodyString })
    console.log({ signature })

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

    console.log(response.json())

    const trackingLog = await app.prisma.trackingLog.findFirstOrThrow()

    expect(response.statusCode).toBe(201)
    expect(await app.prisma.parcel.count()).toBe(1)
    expect(await app.prisma.trackingLog.count()).toBe(1)

    expect(trackingLog.parcelId).toBe(response.json().data.id)
    expect(trackingLog.status).toBe(ShipmentStatus.PendingPickup)
  })

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