import { UserRole } from "@prisma/client"
import { Type, Static } from "@sinclair/typebox"

export const USER_PATHS = {
  register: '/register',
  login: '/login'
} as const;

export const LoginSchema = {
  url: USER_PATHS.login,
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
  url: USER_PATHS.register,
  body: Type.Object({
    email: Type.String({ format: "email" }),
    password: Type.String({ minLength: 6 }),
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