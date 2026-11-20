import { Type, Static } from "@sinclair/typebox";

export const SortationBatchStatusEnum = Type.Union([
  Type.Literal('Scheduled'),
  Type.Literal('Active'),
  Type.Literal('Completed'),
  Type.Literal('Cancelled'),
])

export const SortationBatchSchema = Type.Object({
  id: Type.Integer({ minimum: 1 }),
  startTime: Type.Optional(Type.String({ format: 'date-time' })),
  endTime: Type.Optional(Type.String({ format: 'date-time' })),
  cutOffTime: Type.String({ format: 'date-time' }),
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
  body: CreateSortationBatchBodySchema,
}

export const ParamsSchema = Type.Object({
  id: Type.String(),
})

export const UpdateSortationBatchSchema = {
  body: UpdateSortationBatchBodySchema,
  params: ParamsSchema,
}

export const DeleteSortationBatchSchema = {
  params: ParamsSchema,
}

export const ShowSortationBatchSchema = {
  params: ParamsSchema,
}

export type CreateSortationBatchBody = Static<typeof CreateSortationBatchBodySchema>
export type UpdateSortationBatchBody = Static<typeof UpdateSortationBatchSchema.body>
export type UpdateSortationBatchParams = Static<typeof UpdateSortationBatchSchema.params>
export type DeleteSortationBatchParams = Static<typeof DeleteSortationBatchSchema.params>
export type ShowSortationBatchParams = Static<typeof ParamsSchema>