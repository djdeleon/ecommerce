import { FacilityType, HandoffType, ShipmentStatus, ShippingServiceType, UserRole } from "@prisma/client";
import { FastifyInstance } from "fastify";
import { beforeAll, describe, expect, test } from "vitest";
import { createClient } from "../factory/client.factory.js";
import { generateTrackingNumbers } from "../../src/modules/tracking-numbers/service.js";
import { calculateDigest, decryptSecret } from "#commons/utils/crypto.js";
import { seedMasterInfrustructure } from "../../prisma/seeders/tests/master-infrastructure-tests.seed.js";
import { adminParcels, clientParcels, parcels } from "../../src/modules/parcels/paths.js";
import { createUser } from "../factory/user.factory.js";
import { createFacility } from "#factory";
import { createSector } from "../factory/sector.factory.js";


describe('Parcel Domain', () => {
  let app: FastifyInstance


  async function facilityToFacilityRoutingPipelineSeed() {
    // Facility to Facility
    // - MNL to MAR
    const origBranch = await createFacility(app, {
      name: 'Manila Sorting Gateway',
      code: 'GW-MNL-01',
      address: "659 A. Antonio Villegas St, Ermita, Manila, 1000 Metro Manila, Philippines",
      type: FacilityType.MegaGateway,
      longitude: 120.981105,
      latitude: 14.590152,
      parentId: null
    })

    // Hierarchical PH Address (Origin)
    // Region
    await app.prisma.region.create({
      data: {
        id: "1300000000",
        name: "National Capital Region (NCR)",
        code: "NCR"
      }
    })
    // Province (null)
    // City
    const origCity = await app.prisma.city.create({
      data: {
        id: "1380600000",
        name: "City of Manila",
        code: "MNL",
        provinceId: null,
      }
    })
    // Barangay
    const origBrgy = await app.prisma.barangay.create({
      data: {
        id: "1380601148",
        name: "Barangay 148",
        code: "NCR-MTR-MNL-148",
        cityId: origCity.id,
      }
    })

    const origS01 = await createSector(app, {
      "code": "NCR-MTR-MNL-S01",
      "zone": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              120.997335,
              14.618191
            ],
            [
              120.996161,
              14.620762
            ],
            [
              120.993822,
              14.622563
            ],
            [
              120.992624,
              14.623468
            ],
            [
              120.990515,
              14.625138
            ],
            [
              120.993059,
              14.635933
            ],
            [
              120.986756,
              14.630045
            ],
            [
              120.98416,
              14.630203
            ],
            [
              120.983397,
              14.631246
            ],
            [
              120.981065,
              14.630995
            ],
            [
              120.981462,
              14.634183
            ],
            [
              120.982329,
              14.636257
            ],
            [
              120.981839,
              14.638013
            ],
            [
              120.981441,
              14.638564
            ],
            [
              120.979039,
              14.637893
            ],
            [
              120.979709,
              14.635522
            ],
            [
              120.977955,
              14.63553
            ],
            [
              120.976568,
              14.635175
            ],
            [
              120.973495,
              14.63288
            ],
            [
              120.968625,
              14.635591
            ],
            [
              120.966723,
              14.635124
            ],
            [
              120.963338,
              14.635905
            ],
            [
              120.960971,
              14.635985
            ],
            [
              120.961357,
              14.629692
            ],
            [
              120.957068,
              14.633312
            ],
            [
              120.941395,
              14.634231
            ],
            [
              120.959373,
              14.629056
            ],
            [
              120.959942,
              14.626081
            ],
            [
              120.955452,
              14.61921
            ],
            [
              120.956795,
              14.61437
            ],
            [
              120.957451,
              14.611794
            ],
            [
              120.959763,
              14.611374
            ],
            [
              120.962971,
              14.609596
            ],
            [
              120.964269,
              14.608686
            ],
            [
              120.966686,
              14.608671
            ],
            [
              120.966701,
              14.607737
            ],
            [
              120.967222,
              14.607249
            ],
            [
              120.970213,
              14.605748
            ],
            [
              120.971737,
              14.603624
            ],
            [
              120.973861,
              14.60178
            ],
            [
              120.975703,
              14.60305
            ],
            [
              120.975355,
              14.604802
            ],
            [
              120.975829,
              14.605573
            ],
            [
              120.977192,
              14.607016
            ],
            [
              120.979001,
              14.608776
            ],
            [
              120.980097,
              14.608849
            ],
            [
              120.980508,
              14.609865
            ],
            [
              120.986321,
              14.609856
            ],
            [
              120.990724,
              14.61182
            ],
            [
              120.997335,
              14.618191
            ]
          ]
        ]
      },
      "barangayIds": [
        "1380601148", // Selected Barangay 148 
      ],
      facilityId: origBranch.id
    })

    const destBranch = await createFacility(app, {
      name: 'FSTFY Marikina Hub',
      code: 'BR-MAR-01',
      address: "Sumulong Highway cor. Shoe Avenue, Barangay Santo Niño / Santa Elena, Marikina City, 1800 Metro Manila, Philippines",
      type: FacilityType.LocalBranch,
      longitude: 121.09961,
      latitude: 14.633084,
      parentId: origBranch.id,
    })

    // Hierarchical PH Address (Destination)
    // Region (already created)
    // Province (null)
    // City
    const destCity = await app.prisma.city.create({
      data: {
        id: "1380700000",
        name: "City of Marikina",
        code: "MAR",
        provinceId: null,
      }
    })
    // Barangay
    const destBrgy = await app.prisma.barangay.create({
      data: {
        id: "1380700001",
        name: "Barangka",
        code: "NCR-MTR-MAR-001",
        cityId: destCity.id,
      }
    })

    const destS01 = await createSector(app, {
      "code": "NCR-MTR-MAR-S01",
      "zone": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              121.079017,
              14.618
            ],
            [
              121.081742,
              14.623036
            ],
            [
              121.097633,
              14.619783
            ],
            [
              121.10496,
              14.621358
            ],
            [
              121.104989,
              14.629395
            ],
            [
              121.108693,
              14.636472
            ],
            [
              121.100845,
              14.644581
            ],
            [
              121.089698,
              14.646052
            ],
            [
              121.088456,
              14.644246
            ],
            [
              121.07733,
              14.635216
            ],
            [
              121.07438,
              14.628329
            ],
            [
              121.079017,
              14.618
            ]
          ]
        ]
      },
      "barangayIds": [
        "1380700001", // Barangay Barangka
      ],
      facilityId: destBranch.id
    })

    return {
      origBrgy,
      destBrgy,
      origS01,
      destS01,
      origBranch,
      destBranch,
    }
  }
  beforeAll(async () => {
    app = (globalThis as any).app as FastifyInstance
  })

  const expectedKey = process.env.LOGISTICS_KEY

  describe('Parcel Lifecycle - Routing Pipeline Services', () => {
    /**
     * We are going to deal a Service from beginning to end of the Parcel Lifecycle, BUT, we should also consider how the Parcel is created in the first place
     * - This means a Service should have 3 Parcel Lifecycle test since we have 3 ways to create a Parcel. 
     */
    describe('Facility to Facility Routing Pipeline Service', () => {
      test.only('Facility to Facility Routing Pipeline Service - [a parcel can be booked by customer (customer online) - Courier Pickup]', async () => {
        /**
         * Parcel Lifecycle (Happy Path)
         * - ArrivedAtOriginHub (MegaGateway) -> Sorting -> Bagged -> DepartedFromOriginHub -> ArrivedAtDestinationHub (LocalBranch) -> OutForDelivery -> Delivered
         * - - I added Sorting and Bagged because the parcel is dropped off the Mega Gateway Facility
         * - - - Consider the Facility Type as well.
         * 
         * Other Related Lifecycle:
         * - Manifest Status Lifecycle
         * - Sorting Batch Status Lifecycle
         * - Master Bag Lifecycle
         * - Fleet Transport Lifecycle
         * - Courier Status Lifecycle
         * - Vehicle Status Lifecycle
         * - Delivery Status Lifecycle
         * - Pipeline Status Lifecycle
         * - - For each facility involved.
         * 
         * Related Logs:
         * - Manifest Log
         * - Master Bag Log
         * - Courier Log
         * - Vehicle Location Log
         * - Tracking Log
         * - Parcel Audit Log
         * - Delivery Log
         */
        const { user, token } = await createUser(app, UserRole.Customer);

        const {
          origBrgy,
          destBrgy,
          origS01,
          destS01,
          origBranch,
          destBranch,
        } = await facilityToFacilityRoutingPipelineSeed()

        // Sender (Existing Customer) (Origin)
        const customer = await app.prisma.customer.create({
          data: {
            userId: user.id,
            contactNumber: '09171234567',
            streetAddress: 'Block 5 Lot 12, Muzon',
            barangayId: origBrgy.id,
          },
        });

        const payload = {
          customerId: customer.id,
          handoffType: HandoffType.SenderDropoff,
          shippingServiceType: ShippingServiceType.R,
          weightGrams: 1500,
          lengthCm: 20,
          widthCm: 15,
          heightCm: 10,
          declaredValue: 500,
          recipientName: 'Maria Clara',
          recipientPhone: '09189876543',
          recipientAddress: '123 Barangka St',
          recipientBarangayId: destBrgy.id,
        };

        // Simply hit the endpoint instead of factory
        await app.inject({
          method: 'POST',
          url: adminParcels.store,
          headers: {
            authorization: `Bearer ${token}`,
          },
          body: payload,
        })

        const parcels = await app.prisma.parcel.findMany()
        console.log(parcels)

      })
      test('Facility to Facility Routing Pipeline Service - [a parcel can be booked by system (ecommerce client)]', async () => {
        const {
          origBrgy,
          destBrgy,
          origS01,
          destS01,
          origBranch,
          destBranch,
        } = await facilityToFacilityRoutingPipelineSeed()
      })
    })
  })

  describe('3 Ways to Create Parcels', () => {
    test('a parcel can be booked by admin (customer walk in) - (Sender Dropoff)', async () => {
      const { user, token } = await createUser(app, UserRole.Customer);

      const {
        origBrgy,
        destBrgy,
        origS01,
        destS01,
        origBranch,
        destBranch,
      } = await facilityToFacilityRoutingPipelineSeed()

      // Sender (Existing Customer) (Origin)
      const customer = await app.prisma.customer.create({
        data: {
          userId: user.id,
          contactNumber: '09171234567',
          streetAddress: 'Block 5 Lot 12, Muzon',
          barangayId: origBrgy.id,
        },
      });

      const payload = {
        customerId: customer.id,
        handoffType: HandoffType.SenderDropoff,
        shippingServiceType: ShippingServiceType.R,
        weightGrams: 1500,
        lengthCm: 20,
        widthCm: 15,
        heightCm: 10,
        declaredValue: 500,
        recipientName: 'Maria Clara',
        recipientPhone: '09189876543',
        recipientAddress: '123 Barangka St',
        recipientBarangayId: destBrgy.id,

        // When the sender walks in, the sender doesn't know the coordinate location of course haha. 
        // - but the parcel can still be delivered with only having the barangay and its street address, courier can ask where does the name live.
        // recipientLocation: {
        //   longitude: 121.0822063,
        //   latitude: 14.6327278
        // }
      };

      const response = await app.inject({
        method: 'POST',
        url: adminParcels.store,
        headers: {
          authorization: `Bearer ${token}`,
        },
        body: payload,
      })

      const body = response.json();

      expect(response.statusCode).toBe(201);
      expect(body.message).toBe('Parcel created successfully.');
      expect(body.data).toMatchObject({
        customerId: customer.id,
        storeId: null,
        handoffType: HandoffType.SenderDropoff,
        status: ShipmentStatus.ArrivedAtOriginHub,
        originSectorId: origS01.id,
        destinationSectorId: destS01.id,
        originFacilityId: origBranch.id,
        destinationFacilityId: destBranch.id,
        calculatedCbm: 0.003, // (20 * 15 * 10) / 1_000_000
        recipientName: 'Maria Clara',
        recipientBarangayId: destBrgy.id,
      });
      expect(body.data.trackingNumber).toBeTruthy();

      // Assert Database Side Effects
      const savedParcel = await app.prisma.parcel.findUnique({
        where: { id: body.data.id },
        include: { trackingLogs: true },
      });
      expect(savedParcel).not.toBeNull();
      expect(savedParcel?.trackingLogs).toHaveLength(1);
    })

    test('a parcel can be booked by customer (customer online) - Courier Pickup', async () => {
      const { user, token } = await createUser(app, UserRole.Customer);

      const {
        origBrgy,
        destBrgy,
        origS01,
        destS01,
        origBranch,
        destBranch,
      } = await facilityToFacilityRoutingPipelineSeed()

      // Sender (Existing Customer) (Origin)
      const customer = await app.prisma.customer.create({
        data: {
          userId: user.id,
          contactNumber: '09171234567',
          streetAddress: 'Block 5 Lot 12, Muzon',
          barangayId: origBrgy.id,
        },
      });

      const payload = {
        customerId: customer.id,
        handoffType: HandoffType.CourierPickup,
        shippingServiceType: ShippingServiceType.R,
        weightGrams: 1500,
        lengthCm: 20,
        widthCm: 15,
        heightCm: 10,
        declaredValue: 500,
        recipientName: 'Maria Clara',
        recipientPhone: '09189876543',
        recipientAddress: '123 Barangka St',
        recipientBarangayId: destBrgy.id,
      };

      const response = await app.inject({
        method: 'POST',
        url: parcels.store,
        headers: {
          authorization: `Bearer ${token}`,
        },
        body: payload,
      })

      const body = response.json();
      console.log(body)

      expect(response.statusCode).toBe(201);
      expect(body.message).toBe('Parcel created successfully.');
      expect(body.data).toMatchObject({
        customerId: customer.id,
        storeId: null,
        handoffType: HandoffType.CourierPickup,
        status: ShipmentStatus.PendingPickup,
        originSectorId: origS01.id,
        destinationSectorId: destS01.id,
        originFacilityId: origBranch.id,
        destinationFacilityId: destBranch.id,
        calculatedCbm: 0.003,
        recipientName: 'Maria Clara',
        recipientBarangayId: destBrgy.id,
      });
      expect(body.data.trackingNumber).toBeTruthy();

      const savedParcel = await app.prisma.parcel.findUnique({
        where: { id: body.data.id },
        include: { trackingLogs: true },
      });
      expect(savedParcel).not.toBeNull();
      expect(savedParcel?.trackingLogs).toHaveLength(1);
    })

    test('a parcel can be booked by system (ecommerce client)', async () => {
      const { user, token } = await createUser(app, UserRole.Customer);

      const {
        origBrgy,
        destBrgy,
        origS01,
        destS01,
        origBranch,
        destBranch,
      } = await facilityToFacilityRoutingPipelineSeed()

      const client = await createClient(app, { name: "Laravel E-Commerce" })

      // Sender (Store) (Origin)
      const store = await app.prisma.store.create({
        data: {
          clientId: client.id,
          externalFacilityId: 1,
          name: 'Laravel E-Commerce - Manila',
          contactNumber: '09171234567',
          streetAddress: 'Block 5 Lot 12, Muzon',
          barangayId: origBrgy.id,
        },
      });

      await app.prisma.$executeRaw`
        UPDATE "stores"
        SET location = ST_SetSRID(ST_MakePoint(120.9706452, 14.6235001), 4326)
        WHERE id = ${store.id}
      `;

      const payload = {
        storeId: store.id,
        handoffType: HandoffType.CourierPickup,
        shippingServiceType: ShippingServiceType.R,
        weightGrams: 1500,
        lengthCm: 20,
        widthCm: 15,
        heightCm: 10,
        declaredValue: 500,
        recipientName: 'Maria Clara',
        recipientPhone: '09189876543',
        recipientAddress: '123 Barangka St',
        recipientBarangayId: destBrgy.id,
        recipientCoordinates: {
          lng: 121.0821671,
          lat: 14.6327704
        }
      };

      const response = await app.inject({
        method: 'POST',
        url: clientParcels.store,
        headers: {
          authorization: `Bearer ${token}`,
        },
        body: payload,
      })

      const body = response.json();

      expect(response.statusCode).toBe(201);
      expect(body.message).toBe('Parcel created successfully.');
      expect(body.data).toMatchObject({
        storeId: store.id,
        handoffType: HandoffType.CourierPickup,
        status: ShipmentStatus.PendingPickup,
        originSectorId: origS01.id,
        destinationSectorId: destS01.id,
        originFacilityId: origBranch.id,
        destinationFacilityId: destBranch.id,
        calculatedCbm: 0.003,
        recipientName: 'Maria Clara',
        recipientBarangayId: destBrgy.id,
        recipientCoordinates: {
          lng: payload.recipientCoordinates.lng,
          lat: payload.recipientCoordinates.lat,
        }
      });
      expect(body.data.trackingNumber).toBeTruthy();

      const savedParcel = await app.prisma.parcel.findUnique({
        where: { id: body.data.id },
        include: { trackingLogs: true },
      });
      expect(savedParcel).not.toBeNull();
      expect(savedParcel?.trackingLogs).toHaveLength(1);
    })
  })

  test.skip('a Laravel vendor can book a parcel', async () => {
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
      url: parcels.store,
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