import { Type, Static } from "@sinclair/typebox";

export const DispatchLogSchema = Type.Object({
  id: Type.Integer({ minimum: 1 }),
  assignedCourierId: Type.Integer({ minimum: 1 }),
  originFacilityId: Type.Optional(Type.Integer({ minimum: 1 })),
  dispatchedAt: Type.String({ format: 'date-time' }),
  arrivedAt: Type.Optional(Type.String({ format: 'date-time' })),
  createdAt: Type.String({ format: 'date-time' }),
  updatedAt: Type.String({ format: 'date-time' }),
})

export const CreateDispatchLogBodySchema = Type.Omit(DispatchLogSchema, [
  'id',
  'createdAt',
  'updatedAt',
])

export const UpdateDispatchLogBodySchema = Type.Partial(
  Type.Omit(DispatchLogSchema, ['id', 'createdAt', 'updatedAt'])
)

export const CreateDispatchLogSchema = {
  body: CreateDispatchLogBodySchema,
}

export const UpdateDispatchLogSchema = {
  body: UpdateDispatchLogBodySchema,
  params: Type.Object({
    dispatchLogId: Type.String(),
  }),
}

export const DeleteDispatchLogSchema = {
  params: Type.Object({
    dispatchLogId: Type.String(),
  }),
}

export type CreateDispatchLogBody = Static<typeof CreateDispatchLogBodySchema>
export type UpdateDispatchLogBody = Static<typeof UpdateDispatchLogSchema.body>
export type UpdateDispatchLogParams = Static<typeof UpdateDispatchLogSchema.params>
export type DeleteDispatchLogParams = Static<typeof DeleteDispatchLogSchema.params>