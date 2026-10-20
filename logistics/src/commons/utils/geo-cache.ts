import path from 'path';
import fs from 'fs';
import * as XLSX from 'xlsx';

const LOGISTICS_REGION_CODES: Record<string, string> = {
  '13': 'NCR', // National Capital Region
  '14': 'CAR', // Cordillera Administrative Region
  '01': 'R01', // Ilocos Region
  '02': 'R02', // Cagayan Valley
  '03': 'R03', // Central Luzon
  '04': 'R4A', // CALABARZON
  '17': 'MIM', // MIMAROPA
  '05': 'R05', // Bicol Region
  '06': 'R06', // Western Visayas
  '07': 'R07', // Central Visayas
  '08': 'R08', // Eastern Visayas
  '09': 'R09', // Zamboanga Peninsula
  '10': 'R10', // Northern Mindanao
  '11': 'R11', // Davao Region
  '12': 'R12', // SOCCSKSARGEN
  '16': 'R13', // Caraga
  '19': 'BAM', // BARMM
  '20': 'NIR', // Negros Island Region (Recent PSA assignments)
};

function makeLogisticsAbbr(name: string): string {
  const clean = name
    .replace(/(province of|city of|municipality of)/gi, '') // Strip common metadata prefixes
    .replace(/[^a-zA-Z0-9]/g, '')                           // Remove spaces and special symbols
    .trim()
    .toUpperCase();
  return clean.substring(0, 3);
}

let cachedGeoData: {
  regions: any[];
  provinces: any[];
  cities: any[];
  barangays: any[];
} | null = null;

export function getParsedGeoData() {
  if (cachedGeoData) {
    return cachedGeoData;
  }

  console.log("⏳ Memory Cache Miss. Initializing Adaptive Excel Engine...");
  const rootDir = path.join(process.cwd(), 'src', 'assets', 'geography', 'psgc.xlsx');

  const fileBuffer = fs.readFileSync(rootDir);
  const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
  const worksheet = workbook.Sheets["PSGC"];

  if (!worksheet) throw new Error('Could not find "PSGC" worksheet!');

  const rawData = XLSX.utils.sheet_to_json(worksheet, { range: 0 });

  const regions: any[] = [];
  const provinces: any[] = [];
  const cities: any[] = [];
  const barangays: any[] = [];

  const regionMap: Record<string, string> = {};
  const provinceMap: Record<string, string> = {};
  const cityMap: Record<string, string> = {};

  // ==========================================
  // PASS 1: Seed Parent Structures & Build Maps
  // ==========================================
  for (const row of rawData as any[]) {
    const rawCode = row['10-digit PSGC'];
    if (!rawCode) continue;

    const codeString = String(rawCode).trim().padStart(10, '0');
    const name = String(row['Name'] || '').trim();
    const rawLevel = String(row['Geographic Level'] || '').trim().toLowerCase();

    if (!name || name.includes('total')) continue;

    const regionPrefix = codeString.substring(0, 2);
    const regCode = LOGISTICS_REGION_CODES[regionPrefix] || 'UNK';
    regionMap[regionPrefix] = regCode;

    // Adaptive Matching: Handles "Reg" or "Region"
    if (rawLevel.includes('reg')) {
      regions.push({
        id: codeString,
        name,
        code: regCode
      });
    }
    // Adaptive Matching: Handles "Prov" or "Province"
    else if (rawLevel.includes('prov')) {
      const provPrefix = codeString.substring(0, 5);
      const provAbbr = makeLogisticsAbbr(name);
      provinceMap[provPrefix] = provAbbr;

      provinces.push({
        id: codeString,
        name,
        code: `${regCode}-${provAbbr}`,
        regionId: `${regionPrefix}00000000`
      });
    }
    // Adaptive Matching: Captures "city", "mun", "municipality", or "submun" safely
    else if (rawLevel.includes('city') || rawLevel.includes('mun') || rawLevel.includes('sub')) {
      const cityPrefix = codeString.substring(0, 7);
      const cityAbbr = makeLogisticsAbbr(name);
      cityMap[cityPrefix] = cityAbbr;

      const provPrefix = codeString.substring(0, 5);
      const parentProvinceId = regionPrefix === '13' ? null : `${provPrefix}00000`;

      let provAbbr = provinceMap[provPrefix];

      // SELF-HEALING GUARD: If this is an independent city/HUC with a missing province entry
      if (regionPrefix !== '13' && !provAbbr) {
        // Fallback name uses the City's name context or generic identifier
        const fallbackProvName = `${name} (HUC/Independent Area)`;
        provAbbr = makeLogisticsAbbr(name);
        provinceMap[provPrefix] = provAbbr; // Register into our lookup index

        // Inject the missing parent province dynamically to prevent foreign key errors
        provinces.push({
          id: parentProvinceId!,
          name: fallbackProvName,
          code: `${regCode}-${provAbbr}`,
          regionId: `${regionPrefix}00000000`
        });

        console.log(`Dynamically created missing virtual province node: ${parentProvinceId} for ${name}`);
      }

      const finalProvAbbr = provAbbr || 'MTR';

      cities.push({
        id: codeString,
        name,
        code: `${regCode}-${finalProvAbbr}-${cityAbbr}`,
        provinceId: parentProvinceId
      });
    }
  }

  // ==========================================
  // PASS 2: Independent Slicing for Barangays
  // ==========================================
  for (const row of rawData as any[]) {
    const rawCode = row['10-digit PSGC'];
    if (!rawCode) continue;

    const codeString = String(rawCode).trim().padStart(10, '0');
    const name = String(row['Name'] || '').trim();
    const rawLevel = String(row['Geographic Level'] || '').trim().toLowerCase();

    // Adaptive Matching: Captures "bgy", "bgy.", or "barangay" flawlessly
    if (!(rawLevel.includes('bgy') || rawLevel.includes('barangay')) || !name || name.includes('total')) {
      continue;
    }

    const rKey = codeString.substring(0, 2);
    const pKey = codeString.substring(0, 5);
    const cKey = codeString.substring(0, 7);
    const bgySegment = codeString.substring(7, 10);

    const rAbbr = regionMap[rKey] || 'UNK';
    const pAbbr = provinceMap[pKey] || (rKey === '13' ? 'MTR' : 'UNK');
    const cAbbr = cityMap[cKey] || 'UNK';

    const bgyLogisticsCode = `${rAbbr}-${pAbbr}-${cAbbr}-${bgySegment}`;
    const parentCityId = `${cKey}000`;

    barangays.push({
      id: codeString,
      name,
      code: bgyLogisticsCode,
      cityId: parentCityId
    });
  }

  console.log(`Loaded: ${regions.length} Regions, ${provinces.length} Provinces, ${cities.length} Cities, ${barangays.length} Barangays.`);
  cachedGeoData = { regions, provinces, cities, barangays };
  return cachedGeoData;
}
