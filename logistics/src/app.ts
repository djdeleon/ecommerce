import Fastify from "fastify";
import { prisma } from "./prisma.js";
import { CourierStatus, NetworkType } from "@prisma/client";

export function buildApp() {
  const fastify = Fastify({ logger: true });

  fastify.addHook('preHandler', async (req, rep) => {
    const authHeader = req.headers.authorization; // 'Bearer <secret>' format
    const expectedKey = process.env.LOGISTICS_KEY;

    req.log.info({ authHeader, expectedKey }, 'Debugging Authorization Keys');

    if (!authHeader || authHeader !== `Bearer ${expectedKey}`) {
      return rep.status(401).send({
        error: 'Unauthorized',
        message: 'Access Denied: Missing or invalid Authorization Token.'
      })
    }
  })


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
    firstName: string,
    lastName: string,
    phoneNumber: string,
    vehicleType: string,
    plateNumber: string,
    status: CourierStatus
  }

  fastify.post<{ Body: CourierBody }>('/jnt/couriers', async (req, rep) => {
    const { firstName, lastName, phoneNumber, vehicleType, plateNumber, status } = req.body

    const courier = await prisma.courier.create({
      data: {
        firstName,
        lastName,
        phoneNumber,
        vehicleType,
        plateNumber,
        status
      }
    })

    rep.status(201).send({
      message: "Courier created.",
      data: courier
    })
  })



  interface JntRatesBody {
    origin_zone: string;
    destination_zone: string;
    weight_kg: number
  }

  fastify.post<{ Body: JntRatesBody }>('/jnt/shipping-fee', async (req, rep) => {
    const { origin_zone, destination_zone, weight_kg } = req.body

    const baseRatings = await getBaseRatings(origin_zone, destination_zone)

    const shippingFee = await calculateShippingFee(baseRatings, weight_kg)

    const data = { baseRatings, shippingFee }

    return { status: 200, data }
  })

  return fastify;
}

// fastify.post('/api/v1/jnt/waybill')
