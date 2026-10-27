import { Type, Static } from "@sinclair/typebox";

export const MasterBagStatusEnum = Type.Union([
  Type.Literal('Open'),
  Type.Literal('Sealed'),
  Type.Literal('Dispatched'),
  Type.Literal('Delivered'),
])

export const MasterBagSchema = Type.Object({
  id: Type.Integer({ minimum: 1 }),
  courierScheduleId: Type.Integer({ minimum: 1 }),
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
  'sealedAt',
  'createdAt',
  'updatedAt',
])

export const UpdateMasterBagBodySchema = Type.Partial(
  Type.Omit(MasterBagSchema, ['id', 'createdAt', 'updatedAt'])
)

export const CreateMasterBagSchema = {
  body: CreateMasterBagBodySchema,
}

export const UpdateMasterBagSchema = {
  body: UpdateMasterBagBodySchema,
  params: Type.Object({
    masterBagId: Type.String(),
  }),
}

export const DeleteMasterBagSchema = {
  params: Type.Object({
    masterBagId: Type.String(),
  }),
}

export type CreateMasterBagBody = Static<typeof CreateMasterBagBodySchema>
export type UpdateMasterBagBody = Static<typeof UpdateMasterBagSchema.body>
export type UpdateMasterBagParams = Static<typeof UpdateMasterBagSchema.params>
export type DeleteMasterBagParams = Static<typeof DeleteMasterBagSchema.params>