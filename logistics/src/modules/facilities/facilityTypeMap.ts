import { FacilityType } from "@prisma/client";

export const facilityTypeMap: Record<FacilityType, string> = {
  [FacilityType.MegaGateway]: 'mega_gateway',
  [FacilityType.RegionalHub]: 'regional_hub',
  [FacilityType.LocalBranch]: 'local_branch',
}