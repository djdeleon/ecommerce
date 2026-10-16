import { Type, Static } from "@sinclair/typebox";

export const SECTOR_PATHS = {
  store: '/sectors',
  update: '/sectors/:sectorId',
  delete: '/sectors/:sectorId',
} as const;

// GeoJSON Point/Polygon schema helper for zone
export const GeoJsonPolygonSchema = Type.Object({
  type: Type.Literal("Polygon"),
  coordinates: Type.Array(Type.Array(Type.Array(Type.Number()))),
})

export const SectorSchema = Type.Object({
  id: Type.Integer({ minimum: 1 }),
  code: Type.String({ minLength: 3, maxLength: 15 }),
  localBranchId: Type.Integer({ minimum: 1 }),
  zone: GeoJsonPolygonSchema,
  createdAt: Type.String({ format: 'date-time' }),
  updatedAt: Type.String({ format: 'date-time' }),
})

export const CreateSectorBodySchema = Type.Omit(SectorSchema, [
  'id',
  'createdAt',
  'updatedAt',
])

export const UpdateSectorBodySchema = Type.Partial(CreateSectorBodySchema)

export const CreateSectorSchema = {
  url: SECTOR_PATHS.store,
  body: CreateSectorBodySchema,
}

export const UpdateSectorSchema = {
  url: SECTOR_PATHS.update,
  body: UpdateSectorBodySchema,
  params: Type.Object({
    sectorId: Type.String(),
  }),
}

export const DeleteSectorSchema = {
  url: SECTOR_PATHS.delete,
  params: Type.Object({
    sectorId: Type.String(),
  }),
}

export type CreateSectorBody = Static<typeof CreateSectorBodySchema>
export type UpdateSectorBody = Static<typeof UpdateSectorSchema.body>
export type UpdateSectorParams = Static<typeof UpdateSectorSchema.params>
export type DeleteSectorParams = Static<typeof DeleteSectorSchema.params>