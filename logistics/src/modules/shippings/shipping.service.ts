
  
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