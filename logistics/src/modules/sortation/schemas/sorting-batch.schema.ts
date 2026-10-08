import { Type, Static } from "@sinclair/typebox";

export const SORTATION_BATCH_PATHS = {
  store: '/sortation-batches',
  update: '/sortation-batches/:sortingBatchId',
  delete: '/sortation-batches/:sortingBatchId',
} as const;

export const SortationBatchStatusEnum = Type.Union([
  Type.Literal('Scheduled'),
  Type.Literal('Active'),
  Type.Literal('Completed'),
  Type.Literal('Cancelled'),
])

export const SortationBatchSchema = Type.Object({
  id: Type.Integer({ minimum: 1 }),
  code: Type.String({ minLength: 2, maxLength: 50 }),
  startTime: Type.Optional(Type.String({ format: 'date-time' })),
  endTime: Type.Optional(Type.String({ format: 'date-time' })),
  facilityId: Type.Integer({ minimum: 1 }),
  status: Type.Optional(SortationBatchStatusEnum),
  completedAt: Type.Optional(Type.String({ format: 'date-time' })),
  createdAt: Type.String({ format: 'date-time' }),
  updatedAt: Type.String({ format: 'date-time' }),
})

export const CreateSortationBatchBodySchema = Type.Omit(SortationBatchSchema, [
  'id',
  'completedAt',
  'createdAt',
  'updatedAt',
])

export const UpdateSortationBatchBodySchema = Type.Partial(
  Type.Omit(SortationBatchSchema, ['id', 'createdAt', 'updatedAt'])
)

export const CreateSortationBatchSchema = {
  url: SORTATION_BATCH_PATHS.store,
  body: CreateSortationBatchBodySchema,
}

export const UpdateSortationBatchSchema = {
  url: SORTATION_BATCH_PATHS.update,
  body: UpdateSortationBatchBodySchema,
  params: Type.Object({
    sortingBatchId: Type.String(),
  }),
}

export const DeleteSortationBatchSchema = {
  url: SORTATION_BATCH_PATHS.delete,
  params: Type.Object({
    sortingBatchId: Type.String(),
  }),
}

export type CreateSortationBatchBody = Static<typeof CreateSortationBatchBodySchema>
export type UpdateSortationBatchBody = Static<typeof UpdateSortationBatchSchema.body>
export type UpdateSortationBatchParams = Static<typeof UpdateSortationBatchSchema.params>
export type DeleteSortationBatchParams = Static<typeof DeleteSortationBatchSchema.params>