import { Type, Static } from "@sinclair/typebox";

export const StatusEnum = Type.Union([
  Type.Literal('Accumulation'),
  Type.Literal('LineHaul'),
  Type.Literal('Delivery'),
])

export const Schema = Type.Object({
  id: Type.Integer({ minimum: 1 }),
  courierId: Type.Optional(Type.Integer({ minimum: 1 })),
  vehicleId: Type.Integer({ minimum: 1 }),
  networkLegId: Type.Optional(Type.Integer({ minimum: 1 })),
  scheduledFor: Type.Optional(StatusEnum),
  scheduledTime: Type.String({ format: 'date-time' }),
  masterBagIds: Type.Optional(Type.Array(Type.Number())),
  createdAt: Type.String({ format: 'date-time' }),
  updatedAt: Type.String({ format: 'date-time' }),
})

export const CreateBodySchema = Type.Omit(Schema, [
  'id',
  'createdAt',
  'updatedAt',
])

export const UpdateBodySchema = Type.Partial(CreateBodySchema)

export const CreateSchema = {
  body: CreateBodySchema,
}

export const UpdateSchema = {
  body: UpdateBodySchema,
  params: Type.Object({
    id: Type.String(),
  }),
}

export const DeleteSchema = {
  params: Type.Object({
    id: Type.String(),
  }),
}

export type CreateBody = Static<typeof CreateBodySchema>
export type UpdateBody = Static<typeof UpdateSchema.body>
export type UpdateParams = Static<typeof UpdateSchema.params>
export type DeleteParams = Static<typeof DeleteSchema.params>