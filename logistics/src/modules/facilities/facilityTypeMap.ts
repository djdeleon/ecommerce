import { FacilityType } from "@prisma/client";

export const facilityTypeMap: Record<FacilityType, string> = {
  [FacilityType.MegaGateway]:        'mega_gateway',
  [FacilityType.DistributionCenter]: 'distribution_center',
  [FacilityType.LocalBranch]:        'local_branch',
}