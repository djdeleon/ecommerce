import { Static, Type } from "@sinclair/typebox"

export const PhysicalVehicleSchema = Type.Object({
  id: Type.Integer({ minimum: 1 }),
  vehicleProfileId: Type.Integer({ minimum: 1 }),
  assignedFacilityId: Type.Integer({ minimum: 1 }),
  plateNumber: Type.String({ minLength: 1, maxLength: 20 }),
  createdAt: Type.String({ format: 'date-time' }),
  updatedAt: Type.String({ format: 'date-time' }),
})

export const CreatePhysicalVehicleBodySchema = Type.Omit(PhysicalVehicleSchema, [
  'id',
  'createdAt',
  'updatedAt',
])

export const UpdatePhysicalVehicleBodySchema = Type.Partial(CreatePhysicalVehicleBodySchema)

export const CreatePhysicalVehicleSchema = {
  body: CreatePhysicalVehicleBodySchema,
}

export const UpdatePhysicalVehicleSchema = {
  body: UpdatePhysicalVehicleBodySchema,
  params: Type.Object({
    physicalVehicleId: Type.String(),
  }),
}

export const DeletePhysicalVehicleSchema = {
  params: Type.Object({
    physicalVehicleId: Type.String(),
  }),
}

export type PhysicalVehicle = Static<typeof PhysicalVehicleSchema>
export type CreatePhysicalVehicleBody = Static<typeof CreatePhysicalVehicleBodySchema>
export type UpdatePhysicalVehicleBody = Static<typeof UpdatePhysicalVehicleSchema.body>
export type UpdatePhysicalVehicleParams = Static<typeof UpdatePhysicalVehicleSchema.params>
export type DeletePhysicalVehicleParams = Static<typeof DeletePhysicalVehicleSchema.params>