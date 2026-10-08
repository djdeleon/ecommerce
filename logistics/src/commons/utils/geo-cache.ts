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

// Global memory container to hold pre-parsed data across test runs
let cachedGeoData: {
  regions: any[];
  provinces: any[];
  cities: any[];
  barangays: any[];
} | null = null;

export function getParsedGeoData() {
  // If already parsed once during this test session, immediately return the memory reference
  if (cachedGeoData) {
    return cachedGeoData;
  }

  console.log("⏳ Memory Cache Miss. Initializing Excel file engine (Only happens once)...");
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

  let currentRegionId: string | null = null;
  let currentProvinceId: string | null = null;
  let currentCityId: string | null = null;
  let currentRegCode = '';
  let currentProvCode = '';
  let currentCityCode = '';

  for (const row of rawData as any[]) {
    const rawCode = row['10-digit PSGC'];
    if (!rawCode) continue;

    const codeString = String(rawCode).trim().padStart(10, '0');
    const name = String(row['Name'] || '').trim();
    const level = String(row['Geographic Level'] || '').trim();

    if (!name || name.toLowerCase().includes('total')) continue;

    const regionPrefix = codeString.substring(0, 2);
    const regCode = LOGISTICS_REGION_CODES[regionPrefix] || 'UNK';

    if (level === 'Reg') {
      currentRegionId = codeString;
      currentProvinceId = null;
      currentCityId = null;
      currentRegCode = regCode; // e.g., "NCR"

      regions.push({
        id: currentRegionId,
        name,
        code: currentRegCode // Target: Hub-to-Hub sorting macro
      });
    }
    else if (level === 'Prov') {
      if (!currentRegionId) currentRegionId = `${regionPrefix}00000000`;

      currentProvinceId = codeString;
      currentCityId = null;

      // 🚀 CHANGED: Convert "Ilocos Sur" -> "ILS" instead of using numeric characters
      const provAbbr = makeLogisticsAbbr(name);
      currentProvCode = `${currentRegCode}-${provAbbr}`; // e.g., "R01-ILS"

      provinces.push({
        id: currentProvinceId,
        name,
        code: currentProvCode, // Target: Middle Tier Sorting Allocation
        regionId: currentRegionId
      });
    }
    else if (level === 'Mun' || level === 'City' || level === 'SubMun') {
      if (!currentRegionId) currentRegionId = `${regionPrefix}00000000`;

      if (!currentProvinceId) {
        // Fallback guard block tracking
        const provAbbr = makeLogisticsAbbr(name);
        currentProvCode = `${currentRegCode}-${provAbbr}`;
      }

      currentCityId = codeString;

      const cityAbbr = makeLogisticsAbbr(name);
      currentCityCode = `${currentProvCode}-${cityAbbr}`; // e.g., "R01-ILS-BAN"

      cities.push({
        id: currentCityId,
        name,
        code: currentCityCode, // Target: Direct Distribution Center Mapping Identifier
        provinceId: level === 'SubMun' || regionPrefix === '13' ? null : currentProvinceId
      });
    }
    else if (level === 'Bgy') {
      if (!currentCityId) {
        currentCityId = `${codeString.substring(0, 7)}000`;

        // Reconstruct code names if previous parent rows were structural spreadsheet omissions
        const provAbbr = 'UNK';
        const cityAbbr = 'UNK';
        currentCityCode = `${regCode}-${provAbbr}-${cityAbbr}`;
      }

      // Take the specific trailing 3-digit unique barangay sequence marker from the PSGC
      const bgySegment = codeString.substring(7, 10);

      // 🚀 CHANGED: Yields an exact 15-character formatted operational key!
      const bgyLogisticsCode = `${currentCityCode}-${bgySegment}`; // e.g., "R01-ILS-BAN-001"

      barangays.push({
        id: codeString,
        name,
        code: bgyLogisticsCode, // Target: Last-Mile Delivery Rider sorting bin assignment
        cityId: currentCityId
      });
    }
  }

  // Save reference to global memory container
  cachedGeoData = { regions, provinces, cities, barangays };
  return cachedGeoData;
}
