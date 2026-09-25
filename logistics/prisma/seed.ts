import { prisma, disconnectPrisma } from '../src/prisma.js';
import { encryptSecret } from '../src/utils/crypto';
import crypto from 'crypto';

async function main() {
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE clients, tracking_number_pools, tracking_logs, parcels, couriers, delivery_boundaries, facilities, users CASCADE;
  `);

  const devClients = [
    {
      name: 'Laravel E-Commerce PH',
      webhookUrl: 'http://reverse-proxy/api/v1/logistics/webhook'
    }
  ]

  for (const devClient of devClients) {
    const apiKey = 'apk_' + crypto.randomBytes(16).toString('hex')
    const apiTextSecret = crypto.randomBytes(32).toString('hex')
    const webhookTextSecret = crypto.randomBytes(32).toString('hex')

    const encryptedApiSecret = encryptSecret(apiTextSecret)
    const encryptedWebhookSecret = encryptSecret(webhookTextSecret)

    await prisma.client.create({
      data: {
        name: devClient.name,
        apiKey,
        apiSecret: encryptedApiSecret,
        webhookUrl: devClient.webhookUrl,
        webhookSecret: encryptedWebhookSecret
      }
    })
  }

  const clients = await prisma.client.findMany()

  console.log(clients)

  const laravel = clients[0]

  interface TrackingNumberPoolInput {
    clientId: number;
    size: number;
  }

  const trackingNumberPoolPayload: TrackingNumberPoolInput = {
    clientId: laravel.id,
    size: 10000
  }

  const trackingNumbers = [];
  const CHUNK_SIZE = 1000;

  for (let i = 0; i < trackingNumberPoolPayload.size; i++) {
    const prefix = 'FSTFY'
    const body = crypto.randomBytes(5).toString('hex').toUpperCase()
    const suffix = 'PH'
    const trackingNumber = `${prefix}${body}${suffix}`

    trackingNumbers.push({
      clientId: trackingNumberPoolPayload.clientId,
      trackingNumber
    })

    if (trackingNumbers.length > CHUNK_SIZE) {
      await prisma.trackingNumberPool.createMany({
        data: trackingNumbers,
        skipDuplicates: true
      })

      trackingNumbers.length = 0
    }
  }

  if (trackingNumbers.length > 0) {
    await prisma.trackingNumberPool.createMany({
      data: trackingNumbers,
      skipDuplicates: true
    })
  }

  const trackingNumberPools = await prisma.trackingNumberPool.count()

  console.log(trackingNumberPools)

  const megaALocation = JSON.stringify({
    type: "Point",
    coordinates: [120.9542427, 14.7570638]
  });

  const [megaA] = await prisma.$queryRaw<any[]>`
    INSERT INTO "facilities" (
      "name",
      "type",
      "sorting_code",
      "address",
      "location",
      "updated_at"
    ) VALUES (
      'Marilao Mega Gateway',
      'mega_gateway',
      'NL-MRL',
      'Marilao, Lias Road, ABC Main St.',
      ST_GeomFromGeoJSON(${megaALocation}),
      NOW()
    )
    RETURNING *;
  `

  console.log(megaA)

  const regionalALocation = JSON.stringify({
    type: "Point",
    coordinates: [121.00376, 14.8068135]
  });

  const [regionalA] = await prisma.$queryRaw<any[]>`
    INSERT INTO "facilities" (
      "name",
      "type",
      "parent_id",
      "sorting_code",
      "address",
      "location",
      "updated_at"
    ) VALUES (
      'Santa Maria Regional Hub',
      'regional_hub',
      ${megaA.id},
      'NL-STMR',
      'Santa Maria, San Vicente, ABC Main St.',
      ST_GeomFromGeoJSON(${regionalALocation}),
      NOW()
    )
    RETURNING *;
  `

  console.log(regionalA)

  const branchALocation = JSON.stringify({
    type: "Point",
    coordinates: [121.0642626, 14.7998613]
  });

  const [branchA] = await prisma.$queryRaw<any[]>`
    INSERT INTO "facilities" (
      "name",
      "type",
      "parent_id",
      "sorting_code",
      "address",
      "location",
      "updated_at"
    ) VALUES (
      'Gumaok Local Branch Hub',
      'local_branch',
      ${regionalA.id},
      'NL-GMK',
      'SJDM, Gumaok, ABC Main St.',
      ST_GeomFromGeoJSON(${branchALocation}),
      NOW()
    )
    RETURNING *;
  `

  console.log(branchA)

  const sanJosePolygon = JSON.stringify({
    type: "Polygon",
    coordinates: [
      [
        [
          121.0262521,
          14.8056291
        ],
        [
          121.0777306,
          14.8304717
        ],
        [
          121.1086148,
          14.8167037
        ],
        [
          121.0696552,
          14.7636666
        ],
        [
          121.0553942,
          14.7901086
        ],
        [
          121.0262521,
          14.8056291
        ]
      ]
    ]
  });

  const [branchAPolygon] = await prisma.$queryRaw<any[]>`
    INSERT INTO "delivery_boundaries" (
      "facility_id",
      "delivery_area"
    ) VALUES (
      ${branchA.id},
      ST_GeomFromGeoJSON(${sanJosePolygon})
    )
    RETURNING *;
  `

  const sellerWarehouse = JSON.stringify({
    type: "Point",
    coordinates: [121.0468066, 14.6411298]
  });

  const [store] = await prisma.$queryRaw<any[]>`
    INSERT INTO "stores" (
      "name",
      "contact_number",
      "address",
      "location"
    ) VALUES (
      'Vendor Warehouse QC',
      '09225356435',
      'Quezon City, Diliman, 123 Main St.',
      ST_GeomFromGeoJSON(${sellerWarehouse})
    )
    RETURNING *;
  `

  console.log(`Mega Gateway A (${megaA.id}): ${megaA.name}`)
  console.log(`Regional Hub A (${regionalA.id}): ${regionalA.name} is connected to ${regionalA.parentId} in ${regionalA.location}`)
  console.log(`Local Branch Hub A (${branchA.id}): ${branchA.name} is connected to ${branchA.parentId}`)
  console.log(`Local Branch Hub A Polygon (${branchA.id}): ${branchA.name} has a delivery area ${branchAPolygon.delivery_area}`)
  console.log(`Vendor Store Warehouse: ${store.name}`)
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await disconnectPrisma();
  });