import { Type, Static } from "@sinclair/typebox";

export const FACILITY_CHUTE_PATHS = {
  store: '/facility-chutes',
  update: '/facility-chutes/:facilityChuteId',
  delete: '/facility-chutes/:facilityChuteId',
} as const;

export const FacilityChuteSchema = Type.Object({
  id: Type.Integer({ minimum: 1 }),
  code: Type.String({ minLength: 1, maxLength: 20 }),
  facilityId: Type.Integer({ minimum: 1 }),
  destinationFacilityId: Type.Integer({ minimum: 1 }),
  isActive: Type.Optional(Type.Boolean()),
  createdAt: Type.String({ format: 'date-time' }),
  updatedAt: Type.String({ format: 'date-time' }),
})

export const CreateFacilityChuteBodySchema = Type.Omit(FacilityChuteSchema, [
  'id',
  'createdAt',
  'updatedAt',
])

export const UpdateFacilityChuteBodySchema = Type.Partial(
  Type.Omit(FacilityChuteSchema, ['id', 'createdAt', 'updatedAt'])
)

export const CreateFacilityChuteSchema = {
  url: FACILITY_CHUTE_PATHS.store,
  body: CreateFacilityChuteBodySchema,
}

export const UpdateFacilityChuteSchema = {
  url: FACILITY_CHUTE_PATHS.update,
  body: UpdateFacilityChuteBodySchema,
  params: Type.Object({
    facilityChuteId: Type.String(),
  }),
}

export const DeleteFacilityChuteSchema = {
  url: FACILITY_CHUTE_PATHS.delete,
  params: Type.Object({
    facilityChuteId: Type.String(),
  }),
}

export type CreateFacilityChuteBody = Static<typeof CreateFacilityChuteBodySchema>
export type UpdateFacilityChuteBody = Static<typeof UpdateFacilityChuteSchema.body>
export type UpdateFacilityChuteParams = Static<typeof UpdateFacilityChuteSchema.params>
export type DeleteFacilityChuteParams = Static<typeof DeleteFacilityChuteSchema.params>