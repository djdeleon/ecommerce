import Fastify from "fastify";
import { prisma } from "./prisma.js";
import { CourierStatus, NetworkType, ShipmentStatus, UserRole } from "@prisma/client";
import { generateEventDescription } from "./logisticsEventDictionary.js";
import fastifyJwt from "@fastify/jwt";
import crypto, { hash } from 'crypto';
import fastifyBcrypt from "fastify-bcrypt";

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

  fastify.get('/jnt/networks', async () => {
    const networks = await prisma.network.findMany();
    const availableCouriers = await prisma.courier.findMany({
      where: {
        status: CourierStatus.Available
      }
    })

    return {
      status: 200,
      message: 'Networks retrieved.',
      data: {
        networks,
        networkTypes: Object.values(NetworkType),
        availableCouriers
      }
    }
  })

  interface NetworkBody {
    name: string,
    type: NetworkType,
    address: string,
  }

  fastify.post<{ Body: NetworkBody }>('/jnt/networks', async (req, rep) => {
    const { name, type, address } = req.body
    const randomSuffix = Math.floor(Math.random() * 10000);

    const code = `JTE-${randomSuffix}`
    const latitude = "14.59"
    const longitude = "120.98"

    const network = await prisma.network.create({
      data: {
        name: name,
        code: code,
        address: address,
        type: type,
        latitude: latitude,
        longitude: longitude,
      }
    })

    rep.status(201).send({
      message: "Network created.",
      data: network
    })
  })

  interface NetworkAssignCourierParams {
    networkId: string;
  }

  interface NetworkAssignCourierBody {
    courierId: string
  }

  fastify.patch<{
    Body: NetworkAssignCourierBody,
    Params: NetworkAssignCourierParams
  }>('/jnt/networks/:networkId/assign-courier', async (req, rep) => {
    const { networkId } = req.params
    const { courierId } = req.body

    const parsedCourierId = parseInt(courierId)
    const parsedNetworkId = parseInt(networkId)

    await prisma.courier.update({
      where: {
        id: parsedCourierId
      },
      data: {
        currentNetworkId: parsedNetworkId
      },
      include: {
        currentNetwork: true
      }
    })

    const updatedNetwork = await prisma.network.findUniqueOrThrow({
      where: {
        id: parsedNetworkId
      },
      include: {
        couriers: true
      }
    })

    rep.status(200).send({
      message: "Courier assigned.",
      data: updatedNetwork
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

  interface ShipmentBody {
    externalOrderId: string,
    providerName: string,
    senderName: string,
    senderPhoneNumber: string,
    senderAddress: string,
    recipientName: string,
    recipientPhoneNumber: string,
    recipientAddress: string,
    weightKg: number,
  }

  fastify.post<{ Body: ShipmentBody }>('/jnt/shipments', {
    preHandler: [verifyLogisticsKey]
  }, async (req, rep) => {
    const { externalOrderId, providerName, senderName, senderPhoneNumber, senderAddress, recipientName, recipientPhoneNumber, recipientAddress, weightKg } = req.body

    // for testing
    await prisma.shipment.deleteMany();

    const randomSuffix = Math.floor(Math.random() * 10000);

    const recipientLatitude = "14.60"
    const recipientLongitude = "120.99"

    const description = generateEventDescription({
      status: ShipmentStatus.PendingPickup
    })

    await prisma.$transaction(async (tx) => {
      const shipment = await tx.shipment.create({
        data: {
          trackingNumber: `JTE-TN-${randomSuffix}`,
          externalOrderId,
          providerName,
          senderName,
          senderPhoneNumber,
          senderAddress,
          recipientName,
          recipientPhoneNumber,
          recipientAddress,
          recipientLatitude,
          recipientLongitude,
          weightKg,
          status: ShipmentStatus.PendingPickup
        }
      })

      await tx.trackingLog.create({
        data: {
          shipmentId: shipment.id,
          status: ShipmentStatus.PendingPickup,
          description: description,
        }
      })
    })

    rep.status(201)
  })

  interface ShipmentParams {
    shipmentId: string;
  }

  interface ShipmentOrderParams {
    externalOrderId: string;
  }

  fastify.patch<{ Params: ShipmentOrderParams }>('/jnt/shipments/:externalOrderId/ready-for-pickup', {
    preHandler: [verifyLogisticsKey]
  }, async (req, rep) => {
    const { externalOrderId } = req.params
    console.dir(externalOrderId)
    const description = generateEventDescription({ status: ShipmentStatus.ReadyForPickup })

    const data = await prisma.$transaction(async (tx) => {
      const updatedShipment = await tx.shipment.update({
        where: { externalOrderId: externalOrderId },
        data: { status: ShipmentStatus.ReadyForPickup }
      })

      await tx.trackingLog.create({
        data: {
          shipmentId: updatedShipment.id,
          status: ShipmentStatus.ReadyForPickup,
          description
        }
      })

      return { updatedShipment }
    })

    rep.status(200).send({
      message: 'Shipment updated.',
      data: data.updatedShipment
    })
  })

  fastify.patch<{ Params: ShipmentParams }>('/jnt/shipments/:shipmentId/picked-up', {
    preHandler: [verifyUserAuth]
  }, async (req, rep) => {
    const { shipmentId } = req.params
    const parsedShipmentId = parseInt(shipmentId)
    const courier = req.user.courier

    const description = generateEventDescription({ status: ShipmentStatus.PickedUp, courierName: courier.firstName, plateNumber: courier.plateNumber })

    const data = await prisma.$transaction(async (tx) => {
      const updatedShipment = await tx.shipment.update({
        where: {
          id: parsedShipmentId
        },
        data: {
          status: ShipmentStatus.PickedUp,
          currentNetworkId: courier.currentNetworkId,
          assignedCourierId: courier.id
        }
      })

      await tx.trackingLog.create({
        data: {
          shipmentId: parsedShipmentId,
          status: ShipmentStatus.PickedUp,
          description,
          networkId: courier.currentNetworkId,
          courierId: courier.id
        }
      })

      return { updatedShipment }
    })

    const laravelWebhookUrl = process.env.LARAVEL_WEBHOOK_URL
    const webhookSecret = process.env.LOGISTICS_WEBHOOK_SECRET

    if (!laravelWebhookUrl || !webhookSecret) {
      console.error('Webhook configuration missing. Skipping dispatch')
      return;
    }

    const body = JSON.stringify({
      external_order_id: data.updatedShipment.externalOrderId,
      tracking_number: data.updatedShipment.trackingNumber,
      courier_id: courier.id,
      status: ShipmentStatus.PickedUp,
      description,
      timeStamp: data.updatedShipment.createdAt
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
      console.error('Network error during Laravel webhook dispatch: ', error)
    })

    rep.status(200).send({
      message: 'Shipment updated.',
      data: data.updatedShipment
    })
  })

  fastify.patch<{ Params: ShipmentParams }>('/jnt/shipments/:shipmentId/in-transit', {
    preHandler: [verifyUserAuth]
  }, async (req, rep) => {
    const { shipmentId } = req.params
    const parsedShipmentId = parseInt(shipmentId)
    const courier = req.user.courier
    const courierNetwork = await prisma.network.findUniqueOrThrow({
      where: { id: courier.currentNetworkId },
    })

    const description = generateEventDescription({ status: ShipmentStatus.InTransit, originHub: courierNetwork.name, destinationHub: 'next hub' })

    const data = await prisma.$transaction(async (tx) => {
      const updatedShipment = await tx.shipment.update({
        where: {
          id: parsedShipmentId
        },
        data: {
          status: ShipmentStatus.InTransit,
          currentNetworkId: courier.currentNetworkId,
          assignedCourierId: courier.id
        }
      })

      await tx.trackingLog.create({
        data: {
          shipmentId: parsedShipmentId,
          status: ShipmentStatus.InTransit,
          description,
          networkId: courier.currentNetworkId,
          courierId: courier.id
        }
      })

      return { updatedShipment }
    })

    rep.status(200).send({
      message: 'Shipment updated.',
      data: data.updatedShipment
    })
  })

  fastify.patch<{ Params: ShipmentParams }>('/jnt/shipments/:shipmentId/arrived-at-hub', {
    preHandler: [verifyUserAuth]
  }, async (req, rep) => {
    const { shipmentId } = req.params
    const parsedShipmentId = parseInt(shipmentId)
    const courier = req.user.courier

    const description = generateEventDescription({ status: ShipmentStatus.ArrivedAtHub, hubName: 'unknown hub' })

    const data = await prisma.$transaction(async (tx) => {
      const updatedShipment = await tx.shipment.update({
        where: {
          id: parsedShipmentId
        },
        data: {
          status: ShipmentStatus.ArrivedAtHub,
          currentNetworkId: courier.currentNetworkId,
          assignedCourierId: courier.id
        }
      })

      await tx.trackingLog.create({
        data: {
          shipmentId: parsedShipmentId,
          status: ShipmentStatus.ArrivedAtHub,
          description,
          networkId: courier.currentNetworkId,
          courierId: courier.id
        }
      })

      return { updatedShipment }
    })

    rep.status(200).send({
      message: 'Shipment updated.',
      data: data.updatedShipment
    })
  })

  fastify.patch<{ Params: ShipmentParams }>('/jnt/shipments/:shipmentId/out-for-delivery', {
    preHandler: [verifyUserAuth]
  }, async (req, rep) => {
    const { shipmentId } = req.params
    const parsedShipmentId = parseInt(shipmentId)
    const courier = req.user.courier

    const description = generateEventDescription({ status: ShipmentStatus.OutForDelivery, courierName: courier.firstName })

    const data = await prisma.$transaction(async (tx) => {
      const updatedShipment = await tx.shipment.update({
        where: {
          id: parsedShipmentId
        },
        data: {
          status: ShipmentStatus.OutForDelivery,
          currentNetworkId: courier.currentNetworkId,
          assignedCourierId: courier.id
        }
      })

      await tx.trackingLog.create({
        data: {
          shipmentId: parsedShipmentId,
          status: ShipmentStatus.OutForDelivery,
          description,
          networkId: courier.currentNetworkId,
          courierId: courier.id
        }
      })

      return { updatedShipment }
    })

    rep.status(200).send({
      message: 'Shipment updated.',
      data: data.updatedShipment
    })
  })

  fastify.patch<{ Params: ShipmentParams }>('/jnt/shipments/:shipmentId/delivered', {
    preHandler: [verifyUserAuth]
  }, async (req, rep) => {
    const { shipmentId } = req.params
    const parsedShipmentId = parseInt(shipmentId)
    const courier = req.user.courier

    const description = generateEventDescription({ status: ShipmentStatus.Delivered })

    const data = await prisma.$transaction(async (tx) => {
      const updatedShipment = await tx.shipment.update({
        where: {
          id: parsedShipmentId
        },
        data: {
          status: ShipmentStatus.Delivered,
          currentNetworkId: courier.currentNetworkId,
          assignedCourierId: courier.id
        }
      })

      await tx.trackingLog.create({
        data: {
          shipmentId: parsedShipmentId,
          status: ShipmentStatus.Delivered,
          description,
          networkId: courier.currentNetworkId,
          courierId: courier.id
        }
      })

      return { updatedShipment }
    })

    const laravelWebhookUrl = process.env.LARAVEL_WEBHOOK_URL
    const webhookSecret = process.env.LOGISTICS_WEBHOOK_SECRET

    if (!laravelWebhookUrl || !webhookSecret) {
      console.error('Webhook configuration missing. Skipping dispatch')
      return;
    }

    const body = JSON.stringify({
      external_order_id: data.updatedShipment.externalOrderId,
      tracking_number: data.updatedShipment.trackingNumber,
      courier_id: courier.id,
      status: ShipmentStatus.Delivered,
      description,
      timeStamp: data.updatedShipment.createdAt
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
      console.error('Network error during Laravel webhook dispatch: ', error)
    })

    rep.status(200).send({
      message: 'Shipment updated.',
      data: data.updatedShipment
    })
  })

  fastify.patch<{ Params: ShipmentParams }>('/jnt/shipments/:shipmentId/rejected', {
    preHandler: [verifyLogisticsKey]
  }, async (req, rep) => {
    const { shipmentId } = req.params
    const parsedShipmentId = parseInt(shipmentId)
    const description = generateEventDescription({ status: ShipmentStatus.Rejected, reason: 'The last stock is broken.' })

    const data = await prisma.$transaction(async (tx) => {
      const updatedShipment = await tx.shipment.update({
        where: {
          id: parsedShipmentId
        },
        data: {
          status: ShipmentStatus.Rejected
        }
      })

      await tx.trackingLog.create({
        data: {
          shipmentId: parsedShipmentId,
          status: ShipmentStatus.Rejected,
          description
        }
      })

      return { updatedShipment }
    })

    rep.status(200).send({
      message: 'Shipment updated.',
      data: data.updatedShipment
    })
  })

  interface ShipmentAssignNetworkParams {
    shipmentId: string;
  }

  interface ShipmentAssignNetworkBody {
    networkId: string
  }

  fastify.patch<{
    Body: ShipmentAssignNetworkBody,
    Params: ShipmentAssignNetworkParams
  }>('/jnt/shipments/:shipmentId/assign-network', async (req, rep) => {
    const { networkId } = req.body
    const parsedNetworkId = parseInt(networkId)
    const { shipmentId } = req.params
    const parsedShipmentId = parseInt(shipmentId)

    const updatedShipment = await prisma.shipment.update({
      where: {
        id: parsedShipmentId
      },
      data: {
        currentNetworkId: parsedNetworkId
      },
      include: {
        currentNetwork: true
      }
    })

    rep.status(200).send({
      message: "Network assigned",
      data: updatedShipment
    })
  })

  interface ShipmentAssignCourierParams {
    shipmentId: string;
  }

  interface ShipmentAssignCourierBody {
    courierId: string
  }

  fastify.patch<{
    Body: ShipmentAssignCourierBody,
    Params: ShipmentAssignCourierParams
  }>('/jnt/shipments/:shipmentId/assign-courier', async (req, rep) => {
    const { courierId } = req.body
    const parsedCourierId = parseInt(courierId)
    const { shipmentId } = req.params
    const parsedShipmentId = parseInt(shipmentId)

    const updatedShipment = await prisma.shipment.update({
      where: {
        id: parsedShipmentId
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
      data: updatedShipment
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
