import Fastify from 'fastify';

const fastify = Fastify({ logger: true });

fastify.addHook('preHandler', async (req, rep) => {
    const authHeader = req.headers.authorization; // 'Bearer <secret>' format
    const expectedKey = process.env.LOGISTICS_KEY;

    req.log.info({ authHeader, expectedKey}, 'Debugging Authorization Keys');

    if (!authHeader || authHeader !== `Bearer ${expectedKey}`) {
        return rep.status(401).send({
            error: 'Unauthorized',
            message: 'Access Denied: Missing or invalid Authorization Token.'
        })
    }
})

const REGION_TO_ZONE_MAP: Record<string, string> = {
  // 1. National Capital Region (NCR) -> METRO_MANILA
  'ncr': 'METRO_MANILA',

  // 2. Luzon Regions
  'car': 'LUZON',          // Cordillera Administrative Region
  'region_1': 'LUZON',     // Ilocos Region
  'region_2': 'LUZON',     // Cagayan Valley
  'region_3': 'LUZON',     // Central Luzon
  'region_4a': 'LUZON',    // CALABARZON
  'mimaropa': 'LUZON',     // MIMAROPA (Region IV-B)
  'region_5': 'LUZON',     // Bicol Region

  // 3. Visayas Regions
  'region_6': 'VISAYAS',    // Western Visayas
  'region_7': 'VISAYAS',    // Central Visayas
  'region_8': 'VISAYAS',    // Eastern Visayas

  // 4. Mindanao Regions
  'region_9': 'MINDANAO',   // Zamboanga Peninsula
  'region_10': 'MINDANAO',  // Northern Mindanao
  'region_11': 'MINDANAO',  // Davao Region
  'region_12': 'MINDANAO',  // SOCCSKSARGEN
  'region_13': 'MINDANAO',  // Caraga
  'barmm': 'MINDANAO'       // Bangsamoro Autonomous Region in Muslim Mindanao
};

async function getBaseRatings(islandOrigin: string, islandDestination: string) {
    let baseRate = 0;
    let baseRatePerExtraKilo = 0;

    // for LUZON island origin
    if (islandOrigin === 'LUZON' && islandDestination === 'LUZON') {
        baseRate = 75.00
        baseRatePerExtraKilo = 25.00 
    } else if (islandOrigin === 'LUZON' && islandDestination === 'VISAYAS' || islandDestination === 'MINDANAO') {
        baseRate = 120.00
        baseRatePerExtraKilo = 45.00 
    }

    // for VISAYAS island origin
    if (islandOrigin === 'VISAYAS' && islandDestination === 'VISAYAS') {
        baseRate = 75.00
        baseRatePerExtraKilo = 25.00 
    } else if (islandOrigin === 'VISAYAS' && (islandDestination === 'LUZON' || islandDestination === 'MINDANAO')) {
        baseRate = 120.00
        baseRatePerExtraKilo = 45.00 
    }

    // for VISAYAS island origin
    if (islandOrigin === 'MINDANAO' && islandDestination === 'MINDANAO') {
        baseRate = 75.00
        baseRatePerExtraKilo = 25.00 
    } else if (islandOrigin === 'MINDANAO' && (islandDestination === 'VISAYAS' || islandDestination === 'LUZON')) {
        baseRate = 120.00
        baseRatePerExtraKilo = 45.00 
    }

    return { baseRate, baseRatePerExtraKilo }
}

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

interface JntRatesBody {
    origin_region: string;
    destination_region: string;
    weight_kg: number
}

fastify.post<{ Body: JntRatesBody}>('/jnt/sample', async (req, rep) => {
    const { origin_region, destination_region, weight_kg } = req.body
    
    const islandOriginRegion = REGION_TO_ZONE_MAP[origin_region]
    const islandDestinationRegion = REGION_TO_ZONE_MAP[destination_region]

    const baseRatings = await getBaseRatings(islandOriginRegion, islandDestinationRegion)

    const shippingFee = await calculateShippingFee(baseRatings, weight_kg)

    return { status: 200, islandOriginRegion, islandDestinationRegion, baseRatings, shippingFee }
})

// fastify.post('/api/v1/jnt/waybill')

const start = async () => {
  try {
    await fastify.listen({ port: 8000, host: '0.0.0.0' });
    console.log('Logistics service running on port 8000');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();