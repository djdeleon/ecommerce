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

export const RegisterSchema = {
  body: Type.Object({
    firstName: Type.String({ minLength: 1 }),
    lastName: Type.String({ minLength: 1 }),
    email: Type.String({ format: "email" }),
    password: Type.String({ minLength: 6 }),
    assignedFacilityId: Type.Optional(
      Type.Integer({
        minimum: 1,
        description: "ID of the facility the courier is assigned to",
        examples: [1]
      })
    ),
    role: Type.Enum(UserRole),
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

export type LoginBody = Static<typeof LoginSchema.body>
export type RegisterBody = Static<typeof RegisterSchema.body>