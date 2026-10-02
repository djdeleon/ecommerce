import { PrismaClient } from "@prisma/client";

const generateCode = (name: string) => name.replace(/[^A-Z0-9]/gi, '').substring(0, 6).toUpperCase();
const randomSuffix = Math.floor(Math.random() * 10000);

export async function createMegaGateway(prisma: PrismaClient, data: { name: string; address: string; lng: number; lat: number }) {
  const code = generateCode(data.name);

  const [megaGateway] = await prisma.$queryRaw<any[]>`
    INSERT INTO "mega_gateways" ("name", "code", "address", "location")
    VALUES (
      ${data.name}, 
      ${code}, 
      ${data.address}, 
      ST_SetSRID(ST_MakePoint(${data.lng}, ${data.lat}), 4326)
    )
    RETURNING *;
  `;

  return megaGateway;
}

async function generateGatewayCode(prisma: PrismaClient, coverageCode: string): Promise<string> {
  // coverageCode is like "NCR" or "R03"
  const count = await prisma.megaGateway.count({
    where: { coverageCode }
  });

  const sequence = String(count + 1).padStart(2, '0');
  return `GW-${coverageCode}-${sequence}`; // ➔ GW-NCR-01
}

async function generateDcCode(prisma: PrismaClient, coverageCode: string): Promise<string> {
  // coverageCode is like "NCR-CAL" or "R03-BUL"
  const count = await prisma.distributionCenter.count({
    where: { coverageCode }
  });

  const sequence = String(count + 1).padStart(2, '0');
  return `DC-${coverageCode}-${sequence}`; // ➔ DC-R03-BUL-01
}

async function generateBranchCode(prisma: PrismaClient, coverageCode: string): Promise<string> {
  // coverageCode is like "R03-BUL-SJD" or "NCR-CAL-CAL"
  const segments = coverageCode.split('-');
  const cityAbbr = segments[2] || 'UNK'; // Extracts "SJD" or "CAL"

  const count = await prisma.localBranch.count({
    where: { coverageCode }
  });

  // Branches use 4-digit serial ranges starting at 1001 for enterprise scannability
  const sequence = 1001 + count;
  return `BR-${cityAbbr}-${sequence}`; // ➔ BR-SJD-1001
}

export async function createDistributionCenter(prisma: PrismaClient, data: { name: string; address: string; lng: number; lat: number; megaGatewayId?: number | null }) {
  const code = generateCode(data.name);

  const [distributionCenter] = await prisma.$queryRaw<any[]>`
    INSERT INTO "distribution_centers" ("name", "code", "address", "location", "mega_gateway_id")
    VALUES (
      ${data.name}, 
      ${code}, 
      ${data.address}, 
      ST_SetSRID(ST_MakePoint(${data.lng}, ${data.lat}), 4326),
      ${data.megaGatewayId || null}
    )
    RETURNING *;
  `;

  return distributionCenter;
}

export async function createLocalBranch(prisma: PrismaClient, data: { name: string; address: string; lng: number; lat: number; distributionCenterId?: number | null }) {
  const code = `BR-${generateCode(data.name)}`;

  const [localBranch] = await prisma.$queryRaw<any[]>`
    INSERT INTO "local_branches" ("name", "code", "address", "location", "distribution_center_id")
    VALUES (
      ${data.name}, 
      ${code}, 
      ${data.address}, 
      ST_SetSRID(ST_MakePoint(${data.lng}, ${data.lat}), 4326),
      ${data.distributionCenterId}
    )
    RETURNING *;
  `;

  return localBranch;
}

export async function createSector(prisma: PrismaClient, data: { code: string, localBranchId: number; zone: object }) {
  // I think it is better to make the code 0A1, 0A2, 0A3, 0B1, 0B2
  // For Sectors in San Carlos City (0A1, 0A2, 0A3)
  // For Sectors in Calaciao (0B1, 0B2)
  // The letter increments and the number is reset back to 1
  const [sector] = await prisma.$queryRaw<any[]>`
    INSERT INTO "sectors" ("code","local_branch_id", "zone")
    VALUES (
      ${data.code}, 
      ${data.localBranchId},
      ST_SetSRID(ST_GeomFromGeoJSON(${JSON.stringify(data.zone)}), 4326)
    )
    RETURNING *;
  `;

  return sector;
}

// export async function createMegaGateway(overrides = {}) {
//   const app = (globalThis as any).app as FastifyInstance

//   const randomSuffix = Math.floor(Math.random() * 10000);

//   const longitude = (overrides as any).longitude ?? 121.0
//   const latitude = (overrides as any).latitude ?? 14.0

//   const { longitude: _, latitude: __, ...cleanOverrides } = overrides as any;

//   const megaGateway = await app.prisma.megaGateway.create({
//     data: {
//       name: `Test Hub ${randomSuffix}`,
//       code: `HUB-${randomSuffix}`,
//       address: `${randomSuffix} Test Street, Manila`,
//       ...cleanOverrides,
//     }
//   })

//   await app.prisma.$executeRaw`
//     UPDATE mega_gateways
//     SET location = ST_SetSRID(ST_MakePoint(${parseFloat(longitude)}, ${parseFloat(latitude)}), 4326)
//     WHERE id = ${megaGateway.id}
//   `

//   const [gatewayWithLocation] = await app.prisma.$queryRaw<any[]>`
//     SELECT 
//       id, 
//       name, 
//       code, 
//       address, 
//       ST_AsGeoJSON(location) AS location
//     FROM "mega_gateways"
//     WHERE id = ${megaGateway.id}
//   `;

//   return gatewayWithLocation
// }

// export async function createDistributionCenter(overrides = {}) {
//   const app = (globalThis as any).app as FastifyInstance

//   const randomSuffix = Math.floor(Math.random() * 10000);

//   const longitude = (overrides as any).longitude ?? 121.0
//   const latitude = (overrides as any).latitude ?? 14.0

//   const { longitude: _, latitude: __, ...cleanOverrides } = overrides as any;

//   const megaGateway = await app.prisma.megaGateway.create({
//     data: {
//       name: `Test Hub ${randomSuffix}`,
//       code: `HUB-${randomSuffix}`,
//       address: `${randomSuffix} Test Street, Manila`,
//       ...cleanOverrides,
//     }
//   })

//   await app.prisma.$executeRaw`
//     UPDATE mega_gateways
//     SET location = ST_SetSRID(ST_MakePoint(${parseFloat(longitude)}, ${parseFloat(latitude)}), 4326)
//     WHERE id = ${megaGateway.id}
//   `

//   const [gatewayWithLocation] = await app.prisma.$queryRaw<any[]>`
//     SELECT 
//       id, 
//       name, 
//       code, 
//       address, 
//       ST_AsGeoJSON(location) AS location
//     FROM "mega_gateways"
//     WHERE id = ${megaGateway.id}
//   `;

//   return gatewayWithLocation
// }

// export async function createLocalBranch(overrides = {}) {
//   const app = (globalThis as any).app as FastifyInstance

//   const randomSuffix = Math.floor(Math.random() * 10000);

//   const longitude = (overrides as any).longitude ?? 121.0
//   const latitude = (overrides as any).latitude ?? 14.0

//   const { longitude: _, latitude: __, ...cleanOverrides } = overrides as any;

//   const megaGateway = await app.prisma.megaGateway.create({
//     data: {
//       name: `Test Hub ${randomSuffix}`,
//       code: `HUB-${randomSuffix}`,
//       address: `${randomSuffix} Test Street, Manila`,
//       ...cleanOverrides,
//     }
//   })

//   await app.prisma.$executeRaw`
//     UPDATE mega_gateways
//     SET location = ST_SetSRID(ST_MakePoint(${parseFloat(longitude)}, ${parseFloat(latitude)}), 4326)
//     WHERE id = ${megaGateway.id}
//   `

//   const [gatewayWithLocation] = await app.prisma.$queryRaw<any[]>`
//     SELECT 
//       id, 
//       name, 
//       code, 
//       address, 
//       ST_AsGeoJSON(location) AS location
//     FROM "mega_gateways"
//     WHERE id = ${megaGateway.id}
//   `;

//   return gatewayWithLocation
// }

// export async function createFacility(overrides = {}) {
//   const app = (globalThis as any).app as FastifyInstance

//   const randomSuffix = Math.floor(Math.random() * 10000);

//   const longitude = (overrides as any).longitude ?? 121.0673907
//   const latitude = (overrides as any).latitude ?? 14.7787567

//   const { longitude: _, latitude: __, ...cleanOverrides } = overrides as any;

//   const facility = await app.prisma.facility.create({
//     data: {
//       name: `Test Hub ${randomSuffix}`,
//       type: FacilityType.RegionalHub,
//       sortingCode: `HUB-${randomSuffix}`,
//       address: `${randomSuffix} Test Street, Manila`,
//       ...cleanOverrides,
//     }
//   })

//   await app.prisma.$executeRaw`
//     UPDATE facilities
//     SET location = ST_SetSRID(ST_MakePoint(${parseFloat(longitude)}, ${parseFloat(latitude)}), 4326)
//     WHERE id = ${facility.id}
//   `

//   const [facilityWithLocation] = await app.prisma.$queryRaw<any[]>`
//     SELECT 
//       id, 
//       name, 
//       type, 
//       "sorting_code" AS "sortingCode", 
//       address, 
//       "parent_id" AS "parentId", 
//       "isActive", 
//       "created_at" AS "createdAt", 
//       "updated_at" AS "updatedAt",
//       ST_AsGeoJSON(location) AS location
//     FROM "facilities"
//     WHERE id = ${facility.id}
//   `;

//   return facilityWithLocation
// }
