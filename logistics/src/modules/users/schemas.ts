import { UserRole } from "@prisma/client"
import { Type, Static } from "@sinclair/typebox"

export const LoginSchema = {
  body: Type.Object({
    email: Type.String({
      format: "email",
      description: "The unique registration email address"
    }),
    password: Type.String({
      minLength: 6,
      description: "Plaintext login credential"
    }),
  }),
  response: {
    200: Type.Object({
      message: Type.String(),
      data: Type.Object({
        token: Type.String(),
        user: Type.Object({
          id: Type.Union([Type.String(), Type.Integer()]),
          firstName: Type.String(),
          lastName: Type.String(),
          email: Type.String(),
          role: Type.String(),
          assignedFacilityId: Type.Optional(Type.Union([Type.String(), Type.Integer(), Type.Null()])),
        })
      })
    }),
    401: Type.Object({
      error: Type.String()
    }),
  }
}

export const RegisterSchema = {
  body: Type.Object({
    firstName: Type.String({ minLength: 1 }),
    lastName: Type.String({ minLength: 1 }),
    email: Type.String({ format: "email" }),
    password: Type.String({ minLength: 6 }),
    assignedFacilityId: Type.Optional(
      Type.Union([
        Type.Integer({ minimum: 1 }),
        Type.Null()
      ])
    ),
    role: Type.Optional(Type.Enum(UserRole)),
  }),
  response: {
    200: Type.Object({
      message: Type.String(),
      data: Type.Object({
        user: Type.Object({
          id: Type.String(),
          email: Type.String(),
          role: Type.Enum(UserRole),
        }),
        token: Type.String()
      })
    }),
    401: Type.Object({
      error: Type.String()
    }),
  }
}

export const GetUsersQuerySchema = Type.Object({
  role: Type.Optional(Type.Enum(UserRole)),
  assignedFacilityId: Type.Optional(Type.String()),
  search: Type.Optional(Type.String()),
})

export const UserParamSchema = Type.Object({
  id: Type.String(),
})

export const UpdateUserBodySchema = Type.Object({
  firstName: Type.Optional(Type.String({ minLength: 1 })),
  lastName: Type.Optional(Type.String({ minLength: 1 })),
  email: Type.Optional(Type.String({ format: "email" })),
  assignedFacilityId: Type.Optional(
    Type.Union([Type.Integer({ minimum: 1 }), Type.Null()])
  ),
  role: Type.Optional(Type.Enum(UserRole)),
})

export type LoginBody = Static<typeof LoginSchema.body>
export type RegisterBody = Static<typeof RegisterSchema.body>
export type GetUsersQuery = Static<typeof GetUsersQuerySchema>
export type UserParam = Static<typeof UserParamSchema>
export type UpdateUserBody = Static<typeof UpdateUserBodySchema>