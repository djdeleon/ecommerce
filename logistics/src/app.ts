import Fastify from "fastify";
import { prisma } from "./prisma.js";
import { CourierStatus, FacilityType, ShipmentStatus, UserRole } from "@prisma/client";
import { generateEventDescription } from "./logisticsEventDictionary.js";
import fastifyJwt from "@fastify/jwt";
import crypto, { hash } from 'crypto';
import fastifyBcrypt from "fastify-bcrypt";
import { createFacility, createStore } from "./utils/factories.js";

export function buildApp() {
  const fastify = Fastify({ logger: true });

  fastify.register(fastifyJwt, {
    secret: process.env.JWT_SECRET || 'jwt_logistics_development'
  })

  fastify.register(fastifyBcrypt as any, {
    saltWorkFactor: 10,
  })

  const verifyLogisticsKey = async (req: any, rep: any) => {
    const authHeader = req.headers.authorization;
    const expectedKey = process.env.LOGISTICS_KEY

    if (!authHeader || authHeader !== `Bearer ${expectedKey}`) {
      return rep.status(401).send({
        error: 'Unauthorized',
        message: 'Access Denied: Missing or invalid Authorization Token.'
      })
    }
  }

  const verifyUserAuth = async (req: any, rep: any) => {
    try {
      await req.jwtVerify();

      const userId = req.user.id

      const user = await prisma.user.findUniqueOrThrow({
        where: { id: userId },
        include: { courier: true }
      })

      req.user = user

    } catch (err) {
      return rep.status(401).send({
        error: 'Unauthorized: Invalid or missing token'
      })
    }
  }

  const REGION_TO_ZONE_MAP: Record<string, string> = {
    // Luzon Zones
    // METRO_MANILA
    'ncr': 'metro_manila',
    // North Luzon
    'car': 'north_luzon',          // Cordillera Administrative Region
    'region_1': 'north_luzon',     // Ilocos Region
    'region_2': 'north_luzon',     // Cagayan Valley
    'region_3': 'north_luzon',     // Central Luzon
    // South Luzon
    'region_4a': 'south_luzon',    // CALABARZON
    'region_4b': 'south_luzon',    // MIMAROPA (Region IV-B)
    'region_5': 'south_luzon',     // Bicol Region

    // Visayas Zones
    'region_6': 'visayas',        // Western Visayas
    'region_7': 'visayas',        // Central Visayas
    'region_8': 'visayas',        // Eastern Visayas
    'nir': 'visayas',             // Visayas

    // Mindanao Zones
    'region_9': 'mindanao',       // Zamboanga Peninsula
    'region_10': 'mindanao',      // Northern Mindanao
    'region_11': 'mindanao',      // Davao Region
    'region_12': 'mindanao',      // SOCCSKSARGEN
    'region_13': 'mindanao',      // Caraga
    'barmm': 'mindanao'           // Bangsamoro Autonomous Region in Muslim Mindanao
  };

  // const REGION_TO_ZONE_MAP: Record<string, string> = {
  //   // 1. National Capital Region (NCR) -> METRO_MANILA
  //   'ncr': 'METRO_MANILA',

  //   // 2. Luzon Regions
  //   'car': 'LUZON',          // Cordillera Administrative Region
  //   'region_1': 'LUZON',     // Ilocos Region
  //   'region_2': 'LUZON',     // Cagayan Valley
  //   'region_3': 'LUZON',     // Central Luzon
  //   'region_4a': 'LUZON',    // CALABARZON
  //   'region_4b': 'LUZON',     // MIMAROPA (Region IV-B)
  //   'region_5': 'LUZON',     // Bicol Region

  //   // 3. Visayas Regions
  //   'region_6': 'VISAYAS',    // Western Visayas
  //   'region_7': 'VISAYAS',    // Central Visayas
  //   'region_8': 'VISAYAS',    // Eastern Visayas

  //   // 4. Mindanao Regions
  //   'region_9': 'MINDANAO',   // Zamboanga Peninsula
  //   'region_10': 'MINDANAO',  // Northern Mindanao
  //   'region_11': 'MINDANAO',  // Davao Region
  //   'region_12': 'MINDANAO',  // SOCCSKSARGEN
  //   'region_13': 'MINDANAO',  // Caraga
  //   'barmm': 'MINDANAO'       // Bangsamoro Autonomous Region in Muslim Mindanao
  // };

  async function getBaseRatings(zoneOrigin: string, zoneDestination: string) {
    let baseRate = 0;
    let baseRatePerExtraKilo = 0;

    if (zoneOrigin === 'metro_manila' && (zoneDestination === 'metro_manila' || zoneDestination === 'north_luzon' || zoneDestination === 'south_luzon')) {
      baseRate = 45.00
      baseRatePerExtraKilo = 10.00
    } else if (zoneOrigin === 'metro_manila' && zoneDestination === 'visayas') {
      baseRate = 65.00
      baseRatePerExtraKilo = 20.00
    } else if (zoneOrigin === 'metro_manila' && zoneDestination === 'mindanao') {
      baseRate = 85.00
      baseRatePerExtraKilo = 30.00
    }

    if (zoneOrigin === 'north_luzon' && (zoneDestination === 'north_luzon' || zoneDestination === 'metro_manila' || zoneDestination === 'south_luzon')) {
      baseRate = 45.00
      baseRatePerExtraKilo = 10.00
    } else if (zoneOrigin === 'north_luzon' && zoneDestination === 'visayas') {
      baseRate = 65.00
      baseRatePerExtraKilo = 20.00
    } else if (zoneOrigin === 'north_luzon' && zoneDestination === 'mindanao') {
      baseRate = 85.00
      baseRatePerExtraKilo = 30.00
    }

    if (zoneOrigin === 'south_luzon' && (zoneDestination === 'south_luzon' || zoneDestination === 'metro_manila' || zoneDestination === 'north_luzon')) {
      baseRate = 45.00
      baseRatePerExtraKilo = 10.00
    } else if (zoneOrigin === 'north_luzon' && zoneDestination === 'visayas') {
      baseRate = 65.00
      baseRatePerExtraKilo = 20.00
    } else if (zoneOrigin === 'north_luzon' && zoneDestination === 'mindanao') {
      baseRate = 85.00
      baseRatePerExtraKilo = 30.00
    }

    if (zoneOrigin === 'visayas' && zoneDestination === 'visayas') {
      baseRate = 45.00
      baseRatePerExtraKilo = 10.00
    } else if (zoneOrigin === 'visayas' && (zoneDestination === 'metro_manila' || zoneDestination === 'north_luzon' || zoneDestination === 'south_luzon')) {
      baseRate = 65.00
      baseRatePerExtraKilo = 20.00
    } else if (zoneOrigin === 'visayas' && zoneDestination === 'mindanao') {
      baseRate = 65.00
      baseRatePerExtraKilo = 20.00
    }

    if (zoneOrigin === 'mindanao' && zoneDestination === 'mindanao') {
      baseRate = 45.00
      baseRatePerExtraKilo = 10.00
    } else if (zoneOrigin === 'mindanao' && zoneDestination === 'visayas') {
      baseRate = 65.00
      baseRatePerExtraKilo = 20.00
    } else if (zoneOrigin === 'mindanao' && (zoneDestination === 'metro_manila' || zoneDestination === 'north_luzon' || zoneDestination === 'south_luzon')) {
      baseRate = 85.00
      baseRatePerExtraKilo = 30.00
    }

    return { baseRate, baseRatePerExtraKilo }
  }

  // async function getBaseRatings(islandOrigin: string, islandDestination: string) {
  //     let baseRate = 0;
  //     let baseRatePerExtraKilo = 0;

  //     // for LUZON island origin
  //     if (islandOrigin === 'LUZON' && islandDestination === 'LUZON') {
  //         baseRate = 75.00
  //         baseRatePerExtraKilo = 25.00 
  //     } else if (islandOrigin === 'LUZON' && islandDestination === 'VISAYAS' || islandDestination === 'MINDANAO') {
  //         baseRate = 120.00
  //         baseRatePerExtraKilo = 45.00 
  //     }

  //     // for VISAYAS island origin
  //     if (islandOrigin === 'VISAYAS' && islandDestination === 'VISAYAS') {
  //         baseRate = 75.00
  //         baseRatePerExtraKilo = 25.00 
  //     } else if (islandOrigin === 'VISAYAS' && (islandDestination === 'LUZON' || islandDestination === 'MINDANAO')) {
  //         baseRate = 120.00
  //         baseRatePerExtraKilo = 45.00 
  //     }

  //     // for VISAYAS island origin
  //     if (islandOrigin === 'MINDANAO' && islandDestination === 'MINDANAO') {
  //         baseRate = 75.00
  //         baseRatePerExtraKilo = 25.00 
  //     } else if (islandOrigin === 'MINDANAO' && (islandDestination === 'VISAYAS' || islandDestination === 'LUZON')) {
  //         baseRate = 120.00
  //         baseRatePerExtraKilo = 45.00 
  //     }

  //     return { baseRate, baseRatePerExtraKilo }
  // }

  async function getAdditionalWeight(weight: number) {
    const baseWeight = 1;
    const additionalWeight = Math.abs(baseWeight - weight)

    return additionalWeight
  }

  async function calculateShippingFee(baseRatings: { baseRate: number, baseRatePerExtraKilo: number }, weight: number) {
    const additionalWeight = await getAdditionalWeight(weight)

    const baseRate: number = baseRatings.baseRate
    const baseRatePerExtraKilo: number = baseRatings.baseRatePerExtraKilo

    return baseRate + (additionalWeight * baseRatePerExtraKilo)
  }

  fastify.get('/jnt/facilities', async () => {
    const facilities = await prisma.facility.findMany();
    const availableCouriers = await prisma.courier.findMany({
      where: {
        status: CourierStatus.Available
      }
    })

    return {
      status: 200,
      message: 'Facilities retrieved.',
      data: {
        facilities,
        facilityTypes: Object.values(FacilityType),
        availableCouriers
      }
    }
  })

  interface NetworkBody {
    name: string,
    type: FacilityType,
    address: string,
  }

  fastify.post<{ Body: NetworkBody }>('/jnt/facilities', async (req, rep) => {
    const { name, type, address } = req.body
    const randomSuffix = Math.floor(Math.random() * 10000);

    const facilityTypeMap = {
      'MegaGateway': 'mega_gateway',
      'RegionalHub': 'regional_hub',
      'LocalBranch': 'local_branch',
    }

    const facilityType = facilityTypeMap[type]

    const sortingCode = `JTE-${randomSuffix}`
    const latitude = "14.59"
    const longitude = "120.98"

    const [facility] = await prisma.$queryRaw<any[]>`
      INSERT INTO "facilities" (
        "name",
        "type",
        "sorting_code",
        "address",
        "location",
        "parent_id",
        "updated_at"
      ) VALUES (
        ${name},
        ${facilityType},
        ${sortingCode},
        ${address},
        ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326),
        null,
        NOW()
      )
      RETURNING *;
    `;

    rep.status(201).send({
      message: "Facility created.",
      data: facility
    })
  })

  interface NetworkAssignCourierParams {
    facilityId: string;
  }

  interface NetworkAssignCourierBody {
    courierId: string
  }

  fastify.patch<{
    Body: NetworkAssignCourierBody,
    Params: NetworkAssignCourierParams
  }>('/jnt/facilities/:facilityId/assign-courier', async (req, rep) => {
    const { facilityId } = req.params
    const { courierId } = req.body

    const parsedCourierId = parseInt(courierId)
    const parsedFacilityId = parseInt(facilityId)

    await prisma.courier.update({
      where: {
        id: parsedCourierId
      },
      data: {
        currentFacilityId: parsedFacilityId
      },
      include: {
        currentFacility: true
      }
    })

    const updatedFacility = await prisma.facility.findUniqueOrThrow({
      where: {
        id: parsedFacilityId
      },
      include: {
        couriers: true
      }
    })

    rep.status(200).send({
      message: "Courier assigned.",
      data: updatedFacility
    })
  })

  fastify.get('/jnt/couriers', async () => {
    const couriers = await prisma.courier.findMany();

    return {
      status: 200,
      message: "Couriers retrieved.",
      data: {
        couriers,
        vehicleType: ['Truck', 'Van', 'Bike']
      }
    }
  })

  interface CourierBody {
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    phoneNumber: string,
    vehicleType: string,
    plateNumber: string,
    status: CourierStatus
  }

  fastify.post<{ Body: CourierBody }>('/jnt/couriers', async (req, rep) => {
    const { email, password, firstName, lastName, phoneNumber, vehicleType, plateNumber, status } = req.body

    try {
      const existingUser = await prisma.user.findUnique({
        where: { email }
      })

      if (existingUser) {
        return rep.status(400).send({
          error: 'Email already registered.'
        })
      }

      const hashedPassword = await fastify.bcrypt.hash(password)

      const newUser = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          role: UserRole.Courier
        }
      })

      const courier = await prisma.courier.create({
        data: {
          userId: newUser.id,
          firstName,
          lastName,
          phoneNumber,
          vehicleType,
          plateNumber,
          status
        },
        include: {
          user: true
        }
      })

      const token = fastify.jwt.sign({ id: newUser.id })

      rep.status(201).send({
        message: 'Courier registered.',
        data: {
          courier,
          token,
        }
      })
    } catch (err) {
      return rep.status(500).send({
        'error': 'Internal Server Error: '
      })
    }
  })

  interface ParcelBody {
    externalOrderId: string,
    weightGrams: number,
    storeName: string,
    storeContactNumber: string,
    storeAddress: string,
    storeLocation: object,
    customerName: string,
    customerAddress: string,
    customerPhone: string,
  }

  fastify.post<{ Body: ParcelBody }>('/jnt/parcels', {
    preHandler: [verifyLogisticsKey]
  }, async (req, rep) => {
    console.dir('heres')
    console.dir(req.body)
    const { externalOrderId, weightGrams, storeName, storeContactNumber, storeAddress, storeLocation, customerName, customerAddress, customerPhone } = req.body


    // for testing
    await prisma.parcel.deleteMany();
    const origin = await createFacility({
      name: 'Origin Mega Hub'
    })
    const destination = await createFacility({
      name: 'Destination Regional Hub',
      type: FacilityType.RegionalHub,
    })
    const store = await createStore({
      name: storeName,
      contactNumber: storeContactNumber,
      address: storeAddress,
    })

    const randomSuffix = Math.floor(Math.random() * 10000);

    const description = generateEventDescription({
      status: ShipmentStatus.PendingPickup
    })
    
    const sortingCodeCache = `HUB-BUL-SKY-05`
    const routingPipelineCache = `BUL-NL`

    const data = await prisma.$transaction(async (tx) => {
      const parcel = await tx.parcel.create({
        data: {
          trackingNumber: `JTE-TN-${randomSuffix}`,
          externalOrderId,
          weightGrams,
          originFacilityId: origin.id,
          destinationFacilityId: destination.id,
          currentFacilityId: origin.id,
          sortingCodeCache,
          routingPipelineCache,
          storeId: store.id,
          customerName,
          customerAddress,
          customerPhone,
          status: ShipmentStatus.PendingPickup
        }
      })

      await tx.trackingLog.create({
        data: {
          parcelId: parcel.id,
          status: ShipmentStatus.PendingPickup,
          description,
        }
      })

      return { parcel }
    })

    rep.status(201).send({
      message: 'Parcel created.',
      data: data.parcel
    })
  })

  interface ParcelParams {
    parcelId: string;
  }

  interface ShipmentOrderParams {
    externalOrderId: string;
  }

  fastify.patch<{ Params: ShipmentOrderParams }>('/jnt/parcels/:externalOrderId/ready-for-pickup', {
    preHandler: [verifyLogisticsKey]
  }, async (req, rep) => {
    const { externalOrderId } = req.params
    const description = generateEventDescription({ status: ShipmentStatus.ReadyForPickup })

    const data = await prisma.$transaction(async (tx) => {
      const updatedParcel = await tx.parcel.update({
        where: { externalOrderId: externalOrderId },
        data: { status: ShipmentStatus.ReadyForPickup }
      })

      await tx.trackingLog.create({
        data: {
          parcelId: updatedParcel.id,
          status: ShipmentStatus.ReadyForPickup,
          description
        }
      })

      return { updatedParcel }
    })

    rep.status(200).send({
      message: 'Parcel updated.',
      data: data.updatedParcel
    })
  })

  fastify.patch<{ Params: ParcelParams }>('/jnt/parcels/:parcelId/picked-up', {
    preHandler: [verifyUserAuth]
  }, async (req, rep) => {
    const { parcelId } = req.params
    const parsedParcelId = parseInt(parcelId)
    const courier = req.user.courier

    const description = generateEventDescription({ status: ShipmentStatus.PickedUp, courierName: courier.firstName, plateNumber: courier.plateNumber })

    const data = await prisma.$transaction(async (tx) => {
      const updatedParcel = await tx.parcel.update({
        where: {
          id: parsedParcelId
        },
        data: {
          status: ShipmentStatus.PickedUp,
          currentFacilityId: courier.currentFacilityId,
          assignedCourierId: courier.id
        }
      })

      await tx.trackingLog.create({
        data: {
          parcelId: parsedParcelId,
          status: ShipmentStatus.PickedUp,
          description,
          facilityId: courier.currentFacilityId,
          courierId: courier.id
        }
      })

      return { updatedParcel }
    })

    const laravelWebhookUrl = process.env.LARAVEL_WEBHOOK_URL
    const webhookSecret = process.env.LOGISTICS_WEBHOOK_SECRET

    if (!laravelWebhookUrl || !webhookSecret) {
      console.error('Webhook configuration missing. Skipping dispatch')
      return;
    }

    const body = JSON.stringify({
      external_order_id: data.updatedParcel.externalOrderId,
      tracking_number: data.updatedParcel.trackingNumber,
      courier_id: courier.id,
      status: ShipmentStatus.PickedUp,
      description,
      timeStamp: data.updatedParcel.createdAt
    })

    // webhookHmacSignature
    const hmac = crypto.createHmac('sha256', webhookSecret);
    hmac.update(body)
    const signature = hmac.digest('hex')

    // webhookDispatch
    fetch(laravelWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Logistics-Signature': signature,
        'User-Agent': 'J&T EXpress',
      },
      body
    }).then(async (response) => {
      if (!response.ok) {
        const errorText = await response.text()
        console.error(`Laravel webhook failed with status [${response.status}]: ${errorText}`)
      }
    }).catch((error) => {
      console.error('Facility error during Laravel webhook dispatch: ', error)
    })

    rep.status(200).send({
      message: 'Parcel updated.',
      data: data.updatedParcel
    })
  })

  fastify.patch<{ Params: ParcelParams }>('/jnt/parcels/:parcelId/in-transit', {
    preHandler: [verifyUserAuth]
  }, async (req, rep) => {
    const { parcelId } = req.params
    const parsedParcelId = parseInt(parcelId)
    const courier = req.user.courier
    const courierNetwork = await prisma.facility.findUniqueOrThrow({
      where: { id: courier.currentFacilityId },
    })

    const description = generateEventDescription({ status: ShipmentStatus.InTransit, originHub: courierNetwork.name, destinationHub: 'next hub' })

    const data = await prisma.$transaction(async (tx) => {
      const updatedParcel = await tx.parcel.update({
        where: {
          id: parsedParcelId
        },
        data: {
          status: ShipmentStatus.InTransit,
          currentFacilityId: courier.currentFacilityId,
          assignedCourierId: courier.id
        }
      })

      await tx.trackingLog.create({
        data: {
          parcelId: parsedParcelId,
          status: ShipmentStatus.InTransit,
          description,
          facilityId: courier.currentFacilityId,
          courierId: courier.id
        }
      })

      return { updatedParcel }
    })

    rep.status(200).send({
      message: 'Parcel updated.',
      data: data.updatedParcel
    })
  })

  fastify.patch<{ Params: ParcelParams }>('/jnt/parcels/:parcelId/arrived-at-hub', {
    preHandler: [verifyUserAuth]
  }, async (req, rep) => {
    const { parcelId } = req.params
    const parsedParcelId = parseInt(parcelId)
    const courier = req.user.courier

    const description = generateEventDescription({ status: ShipmentStatus.ArrivedAtHub, hubName: 'unknown hub' })

    const data = await prisma.$transaction(async (tx) => {
      const updatedParcel = await tx.parcel.update({
        where: {
          id: parsedParcelId
        },
        data: {
          status: ShipmentStatus.ArrivedAtHub,
          currentFacilityId: courier.currentFacilityId,
          assignedCourierId: courier.id
        }
      })

      await tx.trackingLog.create({
        data: {
          parcelId: parsedParcelId,
          status: ShipmentStatus.ArrivedAtHub,
          description,
          facilityId: courier.currentFacilityId,
          courierId: courier.id
        }
      })

      return { updatedParcel }
    })

    rep.status(200).send({
      message: 'Parcel updated.',
      data: data.updatedParcel
    })
  })

  fastify.patch<{ Params: ParcelParams }>('/jnt/parcels/:parcelId/out-for-delivery', {
    preHandler: [verifyUserAuth]
  }, async (req, rep) => {
    const { parcelId } = req.params
    const parsedParcelId = parseInt(parcelId)
    const courier = req.user.courier

    const description = generateEventDescription({ status: ShipmentStatus.OutForDelivery, courierName: courier.firstName })

    const data = await prisma.$transaction(async (tx) => {
      const updatedParcel = await tx.parcel.update({
        where: {
          id: parsedParcelId
        },
        data: {
          status: ShipmentStatus.OutForDelivery,
          currentFacilityId: courier.currentFacilityId,
          assignedCourierId: courier.id
        }
      })

      await tx.trackingLog.create({
        data: {
          parcelId: parsedParcelId,
          status: ShipmentStatus.OutForDelivery,
          description,
          facilityId: courier.currentFacilityId,
          courierId: courier.id
        }
      })

      return { updatedParcel }
    })

    rep.status(200).send({
      message: 'Parcel updated.',
      data: data.updatedParcel
    })
  })

  fastify.patch<{ Params: ParcelParams }>('/jnt/parcels/:parcelId/delivered', {
    preHandler: [verifyUserAuth]
  }, async (req, rep) => {
    const { parcelId } = req.params
    const parsedParcelId = parseInt(parcelId)
    const courier = req.user.courier

    const description = generateEventDescription({ status: ShipmentStatus.Delivered })

    const data = await prisma.$transaction(async (tx) => {
      const updatedParcel = await tx.parcel.update({
        where: {
          id: parsedParcelId
        },
        data: {
          status: ShipmentStatus.Delivered,
          currentFacilityId: courier.currentFacilityId,
          assignedCourierId: courier.id
        }
      })

      await tx.trackingLog.create({
        data: {
          parcelId: parsedParcelId,
          status: ShipmentStatus.Delivered,
          description,
          facilityId: courier.currentFacilityId,
          courierId: courier.id
        }
      })

      return { updatedParcel }
    })

    const laravelWebhookUrl = process.env.LARAVEL_WEBHOOK_URL
    const webhookSecret = process.env.LOGISTICS_WEBHOOK_SECRET

    if (!laravelWebhookUrl || !webhookSecret) {
      console.error('Webhook configuration missing. Skipping dispatch')
      return;
    }

    const body = JSON.stringify({
      external_order_id: data.updatedParcel.externalOrderId,
      tracking_number: data.updatedParcel.trackingNumber,
      courier_id: courier.id,
      status: ShipmentStatus.Delivered,
      description,
      timeStamp: data.updatedParcel.createdAt
    })

    // webhookHmacSignature
    const hmac = crypto.createHmac('sha256', webhookSecret);
    hmac.update(body)
    const signature = hmac.digest('hex')

    // webhookDispatch
    fetch(laravelWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Logistics-Signature': signature,
        'User-Agent': 'J&T EXpress',
      },
      body
    }).then(async (response) => {
      if (!response.ok) {
        const errorText = await response.text()
        console.error(`Laravel webhook failed with status [${response.status}]: ${errorText}`)
      }
    }).catch((error) => {
      console.error('Facility error during Laravel webhook dispatch: ', error)
    })

    rep.status(200).send({
      message: 'Parcel updated.',
      data: data.updatedParcel
    })
  })

  fastify.patch<{ Params: ParcelParams }>('/jnt/parcels/:parcelId/rejected', {
    preHandler: [verifyLogisticsKey]
  }, async (req, rep) => {
    const { parcelId } = req.params
    const parsedParcelId = parseInt(parcelId)
    const description = generateEventDescription({ status: ShipmentStatus.Rejected, reason: 'The last stock is broken.' })

    const data = await prisma.$transaction(async (tx) => {
      const updatedParcel = await tx.parcel.update({
        where: {
          id: parsedParcelId
        },
        data: {
          status: ShipmentStatus.Rejected
        }
      })

      await tx.trackingLog.create({
        data: {
          parcelId: parsedParcelId,
          status: ShipmentStatus.Rejected,
          description
        }
      })

      return { updatedParcel }
    })

    rep.status(200).send({
      message: 'Parcel updated.',
      data: data.updatedParcel
    })
  })

  interface ParcelAssignNetworkParams {
    parcelId: string;
  }

  interface ParcelAssignNetworkBody {
    facilityId: string
  }

  fastify.patch<{
    Body: ParcelAssignNetworkBody,
    Params: ParcelAssignNetworkParams
  }>('/jnt/parcels/:parcelId/assign-facility', async (req, rep) => {
    const { facilityId } = req.body
    const parsedFacilityId = parseInt(facilityId)
    const { parcelId } = req.params
    const parsedParcelId = parseInt(parcelId)

    const updatedParcel = await prisma.parcel.update({
      where: {
        id: parsedParcelId
      },
      data: {
        currentFacilityId: parsedFacilityId
      },
      include: {
        currentFacility: true
      }
    })

    rep.status(200).send({
      message: "Facility assigned",
      data: updatedParcel
    })
  })

  interface ShipmentAssignCourierParams {
    parcelId: string;
  }

  interface ShipmentAssignCourierBody {
    courierId: string
  }

  fastify.patch<{
    Body: ShipmentAssignCourierBody,
    Params: ShipmentAssignCourierParams
  }>('/jnt/parcels/:parcelId/assign-courier', async (req, rep) => {
    const { courierId } = req.body
    const parsedCourierId = parseInt(courierId)
    const { parcelId } = req.params
    const parsedParcelId = parseInt(parcelId)

    const updatedParcel = await prisma.parcel.update({
      where: {
        id: parsedParcelId
      },
      data: {
        assignedCourierId: parsedCourierId
      },
      include: {
        assignedCourier: true
      }
    })

    rep.status(200).send({
      message: "Courier assigned",
      data: updatedParcel
    })
  })

  interface JntRatesBody {
    origin_zone: string;
    destination_zone: string;
    weight_kg: number
  }

  fastify.post<{ Body: JntRatesBody }>('/jnt/shipping-fee', {
    preHandler: [verifyLogisticsKey]
  }, async (req, rep) => {
    const { origin_zone, destination_zone, weight_kg } = req.body

    const baseRatings = await getBaseRatings(origin_zone, destination_zone)

    const shippingFee = await calculateShippingFee(baseRatings, weight_kg)

    const data = { baseRatings, shippingFee }

    return { status: 200, data }
  })

  interface UserRegisterBody {
    email: string,
    password: string,
    role: UserRole
  }

  fastify.post<{ Body: UserRegisterBody }>('/jnt/users/register', async (req, rep) => {
    const { email, password, role } = req.body

    try {
      const existingUser = await prisma.user.findUnique({
        where: { email }
      })

      if (existingUser) {
        return rep.status(400).send({
          error: 'Email already registered.'
        })
      }

      const hashedPassword = await fastify.bcrypt.hash(password)

      const newUser = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          role
        }
      })

      const { password: _, ...user } = newUser

      const token = fastify.jwt.sign({ id: user.id })

      rep.status(201).send({
        message: 'user registered.',
        data: {
          user,
          token,
        }
      })
    } catch (err) {
      return rep.status(500).send({
        'error': 'Internal Server Error: '
      })
    }

  })

  interface UserLoginBody {
    email: string,
    password: string,
  }

  fastify.post<{ Body: UserLoginBody }>('/jnt/users/login', async (req, rep) => {
    const { email, password } = req.body

    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return rep.status(401).send({
        error: 'Invalid email or password'
      })
    }

    const isValid = await fastify.bcrypt.compare(password, user.password)

    if (!isValid) {
      return rep.status(401).send({
        error: 'Invalid email or password'
      })
    }

    const token = fastify.jwt.sign({ id: user.id })

    return rep.send({
      message: 'User logged in',
      data: {
        user,
        token
      }
    })
  })

  return fastify;
}

// fastify.post('/api/v1/jnt/waybill')
