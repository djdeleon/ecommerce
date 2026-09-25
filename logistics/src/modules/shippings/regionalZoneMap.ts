

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
