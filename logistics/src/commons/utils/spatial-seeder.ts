import { PrismaClient } from "@prisma/client";
import { createDistributionCenter, createLocalBranch, createMegaGateway } from "../../../tests/factory/facility.factory.js";
import * as fs from 'fs';
import { generateGeographicCode } from "./generate-geographic-code.js";
import { getParsedGeoData } from "./geo-cache.js";

export type IslandGroupFilter = 'ALL' | 'LUZON' | 'VISAYAS' | 'MINDANAO';

// Map island groups to their official PSGC 2-digit regional code prefixes
const LUZON_PREFIXES = ['01', '02', '03', '04', '05', '13', '14', '17'];
const VISAYAS_PREFIXES = ['06', '07', '08', '18'];
const MINDANAO_PREFIXES = ['09', '10', '11', '12', '15', '16'];

function shouldIncludeFeature(psgcCode: string, scope: IslandGroupFilter): boolean {
  if (scope === 'ALL') return true;
  const prefix = psgcCode.substring(0, 2);

  if (scope === 'LUZON') return LUZON_PREFIXES.includes(prefix);
  if (scope === 'VISAYAS') return VISAYAS_PREFIXES.includes(prefix);
  if (scope === 'MINDANAO') return MINDANAO_PREFIXES.includes(prefix);
  return false;
}

export async function seedGeographicAreas(prisma: PrismaClient) {
  try {
    const { regions, provinces, cities, barangays } = getParsedGeoData();

    if (regions.length || provinces.length || cities.length || barangays.length) {
      return;
    }

    console.log(`Injecting pre-cached geodata: ${regions.length} Regions, ${provinces.length} Provinces, ${cities.length} Cities, ${barangays.length} Barangays...`);

    await prisma.$transaction([
      prisma.barangay.deleteMany(),
      prisma.city.deleteMany(),
      prisma.province.deleteMany(),
      prisma.region.deleteMany(),
    ]);

    // Hydrate tables (No truncate needed here since your setup.ts handles it)
    await prisma.region.createMany({ data: regions, skipDuplicates: true });
    await prisma.province.createMany({ data: provinces, skipDuplicates: true });
    await prisma.city.createMany({ data: cities, skipDuplicates: true });

    // Chunk barangay insertions to protect PostgreSQL parameter limits
    const chunkSize = 5000;
    for (let i = 0; i < barangays.length; i += chunkSize) {
      const chunk = barangays.slice(i, i + chunkSize);
      await prisma.barangay.createMany({ data: chunk, skipDuplicates: true });
    }

    console.log("✅ Geodata insertion complete!");
  } catch (error) {
    console.error("❌ Seeding process failed:", error);
  }
}

export async function seedGeographyBoundaries(
  prisma: PrismaClient,
  paths: { region: string; province: string; city: string; barangay: string },
  scope: IslandGroupFilter = 'ALL'
) {
  console.log(`🗺️ Starting Geopolitical Seeding. Scope Filter: [${scope}]`);

  // 1. SEED REGIONS
  const regionsGeojson = JSON.parse(fs.readFileSync(paths.region, 'utf-8'));
  const targetRegions = regionsGeojson.features.filter((f: any) =>
    shouldIncludeFeature(String(f.properties.psgc_code), scope)
  );

  for (const f of targetRegions) {
    await prisma.$executeRawUnsafe(`
      INSERT INTO "regions" ("id", "name", "code", "geometry")
      VALUES ($1, $2, $3, ST_SetSRID(ST_GeomFromGeoJSON($4), 4326)::geometry)
      ON CONFLICT (id) DO NOTHING;
    `,
      Number(f.properties.psgc_code),
      f.properties.ADM1_EN,
      generateGeographicCode(f.properties.ADM1_EN),
      f.geometry
    );
  }

  const provincesGeojson = JSON.parse(fs.readFileSync(paths.province, 'utf-8'));
  const targetProvinces = provincesGeojson.features.filter((f: any) =>
    shouldIncludeFeature(String(f.properties.psgc_code), scope)
  );

  for (const f of targetProvinces) {
    const region = await prisma.region.findFirstOrThrow({
      where: { name: f.properties.ADM1_EN }
    })

    await prisma.$executeRawUnsafe(`
      INSERT INTO "provinces" ("id", "name", "code", "geometry", "region_id")
      VALUES ($1, $2, $3, ST_SetSRID(ST_GeomFromGeoJSON($4), 4326)::geometry, $5)
      ON CONFLICT (id) DO NOTHING;
    `,
      Number(f.properties.psgc_code),
      f.properties.ADM2_EN,
      generateGeographicCode(f.properties.ADM2_EN),
      f.geometry,
      region.id
    );
  }

  const citiesGeojson = JSON.parse(fs.readFileSync(paths.city, 'utf-8'));
  const targetCities = citiesGeojson.features.filter((f: any) =>
    shouldIncludeFeature(String(f.properties.psgc_code), scope)
  );

  for (const f of targetCities) {
    let province = null

    if (f.properties.ADM1_EN !== 'National Capital Region (NCR)') { // No province
      province = await prisma.province.findFirstOrThrow({
        where: { name: f.properties.ADM2_EN }
      })
    }

    await prisma.$executeRawUnsafe(`
        INSERT INTO "cities" ("id", "name", "code", "geometry", "province_id")
        VALUES ($1, $2, $3, ST_SetSRID(ST_GeomFromGeoJSON($4), 4326), $5)
        ON CONFLICT (id) DO NOTHING;
      `,
      Number(f.properties.psgc_code),
      f.properties.ADM3_EN,
      generateGeographicCode(f.properties.ADM3_EN),
      f.geometry,
      province?.id
    );
  }

  console.log(`✅ Geopolitical framework successfully hydrated for scope: [${scope}]`);
}

export async function seedGeoJSONData(prisma: PrismaClient, datasetPath: any) {
  const rawData = fs.readFileSync(datasetPath, 'utf-8');
  const geojson = JSON.parse(rawData);

  console.log(`Successfully loaded ${geojson.features.length} geojson features!`);

  // Track parent IDs contextually to wire up relational fields dynamically
  let lastMegaGatewayId: number | null = null;
  let lastDistributionCenterId: number | null = null;

  const gatewayFeatures = geojson.features.filter((f: any) =>
    f.properties['marker-size'] === 'large' || f.properties.name.includes('Mega')
  );

  const dcFeatures = geojson.features.filter((f: any) =>
    f.properties['marker-size'] === 'medium' || f.properties.name.includes('DC')
  );

  const branchFeatures = geojson.features.filter((f: any) =>
    !(f.properties['marker-size'] === 'large' || f.properties.name.includes('Mega')) &&
    !(f.properties['marker-size'] === 'medium' || f.properties.name.includes('DC'))
  );

  console.log(`Processing ${gatewayFeatures.length} Mega Gateways...`);
  for (const feature of gatewayFeatures) {
    console.log(feature)
    process.exit(0)
    const [lng, lat] = feature.geometry.coordinates;
    const name = feature.properties.name;
    const address = `${name} Street Address`;

    const megaGateway = await createMegaGateway(prisma, { name, address, lng, lat });

    lastMegaGatewayId = megaGateway.id
    console.log(`✅ Seeded Mega Gateway: ${name} (ID: ${lastMegaGatewayId})`);
  }

  console.log(`Processing ${dcFeatures.length} Distribution Centers...`);
  for (const feature of dcFeatures) {
    const [lng, lat] = feature.geometry.coordinates;
    const name = feature.properties.name;
    const address = `${name} Street Address`;

    const distributionCenter = await createDistributionCenter(prisma, {
      name, address, lng, lat, megaGatewayId: lastMegaGatewayId
    });
    lastDistributionCenterId = distributionCenter.id

    console.log(`✅ Seeded Distribution Center: ${name} (ID: ${lastDistributionCenterId})`);
  }

  console.log(`Processing ${branchFeatures.length} Local Branches...`);
  for (const feature of branchFeatures) {
    const [lng, lat] = feature.geometry.coordinates;
    const name = feature.properties.name;
    const address = `${name} Street Address`;

    const localBranch = await createLocalBranch(prisma, {
      name, address, lng, lat, distributionCenterId: lastDistributionCenterId
    });

    console.log(`✅ Seeded Local Branch: ${name} (ID: ${localBranch.id})`);
  }

  console.log('🌱 All data structurally nested and seeded successfully!');
}