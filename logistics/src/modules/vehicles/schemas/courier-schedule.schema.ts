import { Type, Static } from "@sinclair/typebox";

export const COURIER_SCHEDULE_PATHS = {
  store: '/courier-schedules',
  update: '/courier-schedules/:courierScheduleId',
  delete: '/courier-schedules/:courierScheduleId',
} as const;

export const CourierScheduleSchema = Type.Object({
  id: Type.Integer({ minimum: 1 }),
  courierId: Type.Optional(Type.Integer({ minimum: 1 })),
  physicalVehicleId: Type.Integer({ minimum: 1 }),
  networkLegId: Type.Integer({ minimum: 1 }),
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
  url: COURIER_SCHEDULE_PATHS.store,
  body: CreateCourierScheduleBodySchema,
}

export const UpdateCourierScheduleSchema = {
  url: COURIER_SCHEDULE_PATHS.update,
  body: UpdateCourierScheduleBodySchema,
  params: Type.Object({
    courierScheduleId: Type.String(),
  }),
}

export const DeleteCourierScheduleSchema = {
  url: COURIER_SCHEDULE_PATHS.delete,
  params: Type.Object({
    courierScheduleId: Type.String(),
  }),
}

export type CreateCourierScheduleBody = Static<typeof CreateCourierScheduleBodySchema>
export type UpdateCourierScheduleBody = Static<typeof UpdateCourierScheduleSchema.body>
export type UpdateCourierScheduleParams = Static<typeof UpdateCourierScheduleSchema.params>
export type DeleteCourierScheduleParams = Static<typeof DeleteCourierScheduleSchema.params>