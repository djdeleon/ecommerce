import { Type, Static } from "@sinclair/typebox";

export const NETWORK_LEG_PATHS = {
  store: '/network-legs',
  update: '/network-legs/:networkLegId',
  delete: '/network-legs/:networkLegId',
} as const;

// GeoJSON LineString schema helper for route geometry
export const GeoJsonLineStringSchema = Type.Object({
  type: Type.Literal("LineString"),
  coordinates: Type.Array(Type.Array(Type.Number())), // [[lng, lat], [lng, lat], ...]
})

export const TransitModeEnum = Type.Union([
  Type.Literal('LandShuttle'),
  Type.Literal('HighwayLinehaul'),
  Type.Literal('MaritimeRoro'),
  Type.Literal('AirFreight'),
])

export const NetworkLegSchema = Type.Object({
  id: Type.Integer({ minimum: 1 }),
  sourceFacilityId: Type.Integer({ minimum: 1 }),
  destinationFacilityId: Type.Integer({ minimum: 1 }),
  laneCode: Type.String({ minLength: 2, maxLength: 20 }),
  route: GeoJsonLineStringSchema,
  distanceKm: Type.Integer({ minimum: 1 }),
  vehicleProfile: Type.String({ minLength: 1, maxLength: 50 }),
  baseTransitDuration: Type.Integer({ minimum: 1 }), // in seconds
  mode: TransitModeEnum,
  cutOffTime: Type.String({ description: "Time format like HH:mm:ss" }),
  createdAt: Type.String({ format: 'date-time' }),
  updatedAt: Type.String({ format: 'date-time' }),
})

export const CreateNetworkLegBodySchema = Type.Omit(NetworkLegSchema, [
  'id',
  'createdAt',
  'updatedAt',
])

export const UpdateNetworkLegBodySchema = Type.Partial(CreateNetworkLegBodySchema)

export const CreateNetworkLegSchema = {
  url: NETWORK_LEG_PATHS.store,
  body: CreateNetworkLegBodySchema,
}

export const UpdateNetworkLegSchema = {
  url: NETWORK_LEG_PATHS.update,
  body: UpdateNetworkLegBodySchema,
  params: Type.Object({
    networkLegId: Type.String(),
  }),
}

export const DeleteNetworkLegSchema = {
  url: NETWORK_LEG_PATHS.delete,
  params: Type.Object({
    networkLegId: Type.String(),
  }),
}

export type CreateNetworkLegBody = Static<typeof CreateNetworkLegBodySchema>
export type UpdateNetworkLegBody = Static<typeof UpdateNetworkLegSchema.body>
export type UpdateNetworkLegParams = Static<typeof UpdateNetworkLegSchema.params>
export type DeleteNetworkLegParams = Static<typeof DeleteNetworkLegSchema.params>