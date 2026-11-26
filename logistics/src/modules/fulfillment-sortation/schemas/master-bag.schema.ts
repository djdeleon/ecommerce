import { Type, Static } from "@sinclair/typebox";

export const MasterBagStatusEnum = Type.Union([
  Type.Literal('Open'),
  Type.Literal('Full'),
  Type.Literal('Sealed'),
  Type.Literal('Dispatched'),
  Type.Literal('Delivered'),
  Type.Literal('Unbagged'),
])

export const MasterBagSchema = Type.Object({
  id: Type.Integer({ minimum: 1 }),
  code: Type.String(),
  fleetTransportId: Type.Optional(Type.Integer({ minimum: 1 })),
  sortingBatchId: Type.Integer({ minimum: 1 }),
  currentFacilityId: Type.Integer({ minimum: 1 }),
  nextFacilityId: Type.Integer({ minimum: 1 }),
  totalWeight: Type.Integer({ minimum: 0 }),
  totalCbm: Type.Number({ minimum: 0 }),
  totalParcels: Type.Integer({ minimum: 0 }),
  status: Type.Optional(MasterBagStatusEnum),
  sealedAt: Type.Optional(Type.String({ format: 'date-time' })),
  createdAt: Type.String({ format: 'date-time' }),
  updatedAt: Type.String({ format: 'date-time' }),
})

export const CreateMasterBagBodySchema = Type.Omit(MasterBagSchema, [
  'id',
  'code',
  'sealedAt',
  'createdAt',
  'updatedAt',
])

export const UpdateMasterBagBodySchema = Type.Partial(
  Type.Omit(MasterBagSchema, ['id', 'code', 'createdAt', 'updatedAt'])
)

export const IdParamsSchema = Type.Object({
  id: Type.String(),
})

export const CodeParamsSchema = Type.Object({
  code: Type.String(),
})

export const CreateMasterBagSchema = {
  body: CreateMasterBagBodySchema,
}

export const UpdateMasterBagSchema = {
  body: UpdateMasterBagBodySchema,
  params: IdParamsSchema,
}

export const DeleteMasterBagSchema = {
  params: IdParamsSchema,
}

export const ShowMasterBagSchema = {
  params: IdParamsSchema,
}

export type CreateMasterBagBody = Static<typeof CreateMasterBagBodySchema>
export type UpdateMasterBagBody = Static<typeof UpdateMasterBagSchema.body>
export type UpdateMasterBagParams = Static<typeof UpdateMasterBagSchema.params>
export type DeleteMasterBagParams = Static<typeof DeleteMasterBagSchema.params>
export type ShowMasterBagParams = Static<typeof IdParamsSchema>