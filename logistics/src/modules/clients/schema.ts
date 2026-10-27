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

export type StoreBody = Static<typeof StoreSchema.body>