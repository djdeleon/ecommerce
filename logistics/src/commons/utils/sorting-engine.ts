import { ROUTING_MATRIX } from "./routing-matrix.js";

interface SortingOutput {
  sortingCodeCache: string;
  routingPipelineCache: string;
}

export function generateSortingCodes(province: string, city: string, barangay: string): SortingOutput {
  const provKey = province.trim();
  const cityKey = city.trim();
  const bgyKey = barangay.trim();

  console.log({ provKey, cityKey, bgyKey })

  // THIS IS ACTUALLY THE GRAPH which is represented by the facilities table remember
  const route = ROUTING_MATRIX[provKey]?.[cityKey]?.[bgyKey]

  console.log({ route })

  if (route) {
    return {
      sortingCodeCache: `${route.hubCode}-${route.branchCode}-${route.deliveryZone}`,
      routingPipelineCache: `${route.hubCode} -> ${route.branchCode} -> LINE-HAUL`
    }
  }

  const cityFallback = Object.values(ROUTING_MATRIX[provKey]?.[cityKey] || {})[0]
  if (cityFallback) {
    return {
      sortingCodeCache: `${cityFallback.hubCode}-${cityFallback.branchCode}-GEN`,
      routingPipelineCache: `${cityFallback.hubCode} -> ${cityFallback.branchCode} -> MANUAL_SORT`
    };
  }

  return {
    sortingCodeCache: "GBL-GATEWAY-UNMAPPED",
    routingPipelineCache: "CENTRAL_GATEWAY -> MANUAL_TRIAGE"
  };
}