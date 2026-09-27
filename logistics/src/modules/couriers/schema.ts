import { CourierStatus } from "@prisma/client";
import { Type, Static } from "@sinclair/typebox";

export const COURIER_PATHS = {
  index: '/couriers',
  store: '/couriers',
} as const;

export const StoreSchema = {
  url: COURIER_PATHS.store,
  body: Type.Object({
    email: Type.String({
      format: "email",
      description: "The unique registration email address",
      examples: ["courier.john@example.com"]
    }),
    password: Type.String({
      minLength: 6,
      description: "Secure plaintext password (min 8 characters)"
    }),
    firstName: Type.String({
      minLength: 2,
      maxLength: 50,
      description: "Courier's first name"
    }),
    lastName: Type.String({
      minLength: 2,
      maxLength: 50,
      description: "Courier's last name"
    }),
    phoneNumber: Type.String({
      pattern: "^(09|\\+639)\\d{9}$",
      description: "Valid mobile phone number (e.g., 09123456789)",
      examples: ["09123456789"]
    }),
    vehicleType: Type.String({
      description: "Type of vehicle used for deliveries",
      examples: ["Motorcycle", "Van", "Bicycle", "Car"]
    }),
    plateNumber: Type.String({
      minLength: 4,
      maxLength: 15,
      description: "Official vehicle license plate number",
      examples: ["ABC-1234"]
    }),
    status: Type.Enum(CourierStatus)
  }),
  response: {
    201: Type.Object({
      message: Type.String(),
      data: Type.Object({
        courier: Type.Object({
          id: Type.Number(),
          userId: Type.Number(),
          firstName: Type.String(),
          lastName: Type.String(),
          phoneNumber: Type.String(),
          vehicleType: Type.String(),
          plateNumber: Type.String(),
          status: Type.Enum(CourierStatus),
        }),
        token: Type.String()
      })
    }),
    401: Type.Object({
      error: Type.String()
    }),
  }
}

export const IndexSchema = {
  url: COURIER_PATHS.index,
}

export type StoreBody = Static<typeof StoreSchema.body>