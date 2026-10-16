import { Static, Type } from "@sinclair/typebox"

export const VEHICLE_PROFILE_PATHS = {
  store: '/vehicle-profiles',
  update: '/vehicle-profiles/:vehicleProfileId',
  delete: '/vehicle-profiles/:vehicleProfileId',
} as const;

export const VehicleTypeEnum = Type.Union([
  Type.Literal('Van'),
  Type.Literal('Truck'),
  Type.Literal('Motorcycle'),
])

export const VehicleProfileSchema = Type.Object({
  id: Type.Integer({ minimum: 1 }),
  brand: Type.String({ minLength: 1, maxLength: 50 }),
  modelName: Type.String({ minLength: 1, maxLength: 50 }),
  variant: Type.String({ minLength: 1, maxLength: 50 }),
  maxWeightCapacityG: Type.Integer({ minimum: 1 }),
  maxUsableVolumeCbm: Type.Number({ minimum: 0.01 }),
  // Utilization target should be between 0 and 1 (e.g., 0.75 for 75%)
  allocationVolumeTarget: Type.Number({ minimum: 0, maximum: 1 }),
  lengthMm: Type.Integer({ minimum: 1 }),
  widthMm: Type.Integer({ minimum: 1 }),
  heightMm: Type.Integer({ minimum: 1 }),
  type: VehicleTypeEnum,
  createdAt: Type.String({ format: 'date-time' }),
  updatedAt: Type.String({ format: 'date-time' }),
})

export const CreateVehicleBodySchema = Type.Omit(VehicleProfileSchema, [
  'id',
  'createdAt',
  'updatedAt',
])

export const CreateVehicleProfileSchema = {
  body: Type.Omit(VehicleProfileSchema, [
    'id',
    'createdAt',
    'updatedAt',
  ])
}

export const UpdateVehicleBodySchema = Type.Partial(CreateVehicleBodySchema)

export const UpdateVehicleSchema = {
  body: UpdateVehicleBodySchema,
  params: Type.Object({
    vehicleProfileId: Type.String(),
  }),
}

export const CreateVehicleSchema = {
  body: CreateVehicleBodySchema,
}

export const DeleteVehicleSchema = {
  params: Type.Object({
    vehicleProfileId: Type.String(),
  }),
}

export type VehicleProfile = Static<typeof VehicleProfileSchema>
export type CreateVehicleProfile = Static<typeof CreateVehicleBodySchema>
export type UpdateVehicleBody = Static<typeof UpdateVehicleSchema.body>
export type UpdateVehicleParams = Static<typeof UpdateVehicleSchema.params>
export type DeleteVehicleParams = Static<typeof DeleteVehicleSchema.params>