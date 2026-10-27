import { Type, Static } from "@sinclair/typebox";

export const CourierScheduleStatusEnum = Type.Union([
  Type.Literal('Accumulation'),
  Type.Literal('LineHaul'),
  Type.Literal('Delivery'),
])

export const CourierScheduleSchema = Type.Object({
  id: Type.Integer({ minimum: 1 }),
  courierId: Type.Optional(Type.Integer({ minimum: 1 })),
  vehicleId: Type.Integer({ minimum: 1 }),
  networkLegId: Type.Integer({ minimum: 1 }),
  scheduledFor: Type.Optional(CourierScheduleStatusEnum),
  scheduledTime: Type.String({ format: 'date-time' }),
  createdAt: Type.String({ format: 'date-time' }),
  updatedAt: Type.String({ format: 'date-time' }),
})

export const CreateCourierScheduleBodySchema = Type.Omit(CourierScheduleSchema, [
  'id',
  'createdAt',
  'updatedAt',
])

export const UpdateCourierScheduleBodySchema = Type.Partial(CreateCourierScheduleBodySchema)

export const CreateCourierScheduleSchema = {
  body: CreateCourierScheduleBodySchema,
}

export const UpdateCourierScheduleSchema = {
  body: UpdateCourierScheduleBodySchema,
  params: Type.Object({
    courierScheduleId: Type.String(),
  }),
}

export const DeleteCourierScheduleSchema = {
  params: Type.Object({
    courierScheduleId: Type.String(),
  }),
}

export type CreateCourierScheduleBody = Static<typeof CreateCourierScheduleBodySchema>
export type UpdateCourierScheduleBody = Static<typeof UpdateCourierScheduleSchema.body>
export type UpdateCourierScheduleParams = Static<typeof UpdateCourierScheduleSchema.params>
export type DeleteCourierScheduleParams = Static<typeof DeleteCourierScheduleSchema.params>