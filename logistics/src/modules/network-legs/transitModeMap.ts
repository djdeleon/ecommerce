import { TransitMode } from "@prisma/client";

export const transitModeMap: Record<TransitMode | any, string> = {
  [TransitMode.LandShuttle]:     'land_shuttle',
  [TransitMode.HighwayLinehaul]: 'highway_linehaul',
  [TransitMode.MaritimeRoro]:    'maritime_roro',
  [TransitMode.AirFreight]:      'air_freight',
}