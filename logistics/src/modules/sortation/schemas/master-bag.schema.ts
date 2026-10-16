import { MasterBagStatus } from "@prisma/client";
import { Type, Static } from "@sinclair/typebox";

export const MASTER_BAG_PATHS = {
  store: '/master-bags',
  update: '/master-bags/:masterBagId',
  delete: '/master-bags/:masterBagId',
} as const;

export const MasterBagStatusEnum = Type.Union([
  Type.Literal('Open'),
  Type.Literal('Sealed'),
  Type.Literal('Dispatched'),
  Type.Literal('Delivered'),
])

export const MasterBagSchema = Type.Object({
  id: Type.Integer({ minimum: 1 }),
  code: Type.String({ minLength: 2, maxLength: 50 }),
  courierScheduleId: Type.Integer({ minimum: 1 }),
  sortingBatchId: Type.Integer({ minimum: 1 }),
  currentFacilityId: Type.Integer({ minimum: 1 }),
  nextFacilityId: Type.Integer({ minimum: 1 }),
  totalWeight: Type.Integer({ minimum: 0 }),
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
  url: MASTER_BAG_PATHS.store,
  body: CreateMasterBagBodySchema,
}

export const UpdateMasterBagSchema = {
  url: MASTER_BAG_PATHS.update,
  body: UpdateMasterBagBodySchema,
  params: Type.Object({
    masterBagId: Type.String(),
  }),
}

export const DeleteMasterBagSchema = {
  url: MASTER_BAG_PATHS.delete,
  params: Type.Object({
    masterBagId: Type.String(),
  }),
}

export type CreateMasterBagBody = Static<typeof CreateMasterBagBodySchema>
export type UpdateMasterBagBody = Static<typeof UpdateMasterBagSchema.body>
export type UpdateMasterBagParams = Static<typeof UpdateMasterBagSchema.params>
export type DeleteMasterBagParams = Static<typeof DeleteMasterBagSchema.params>