// ... existing code ...
import { Static, Type } from "@sinclair/typebox";

export const StoreSchema = {
  body: Type.Object({
    name: Type.String({
      minLength: 2,
      maxLength: 50,
      description: "Clients's name"
    })
  })
}

export const UpdateSchema = {
  params: Type.Object({
    id: Type.String()
  }),
  body: Type.Object({
    name: Type.Optional(Type.String({ minLength: 2, maxLength: 50 })),
    webhookUrl: Type.Optional(Type.String({ format: 'uri' })),
    isActive: Type.Optional(Type.Boolean())
  })
}

export const ParamsSchema = {
  params: Type.Object({
    id: Type.String()
  })
}

export type StoreBody = Static<typeof StoreSchema.body>
export type UpdateBody = Static<typeof UpdateSchema.body>
export type ClientParams = Static<typeof ParamsSchema.params>