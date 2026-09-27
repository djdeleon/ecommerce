import { Type, Static } from "@sinclair/typebox";

export const TRACKING_NUMBER_PATHS = {
  index: '/tracking-numbers',
  store: '/tracking-numbers',
} as const;

export const StoreSchema = {
  url: TRACKING_NUMBER_PATHS.store,
  body: Type.Object({
    clientId: Type.String({
      minLength: 1,
      description: "Unique integer identifier of the client"
    }),
    size: Type.Number({
      maximum: 100000,
      description: "Tracking Number generation is maxed to 100k",
    }),
  })
}

export type StoreBody = Static<typeof StoreSchema.body>