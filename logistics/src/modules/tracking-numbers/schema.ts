import { Type, Static } from "@sinclair/typebox";

export const StoreSchema = {
  body: Type.Object({
    size: Type.Number({
      maximum: 100000,
      description: "Tracking Number generation is maxed to 100k",
    }),
  }),
}

export type StoreBody = Static<typeof StoreSchema.body>