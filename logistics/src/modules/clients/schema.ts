import { Static, Type } from "@sinclair/typebox";

export const CLIENT_PATHS = {
  index: '/clients',
  store: '/clients',
} as const;

export const StoreSchema = {
  url: CLIENT_PATHS.store,
  body: Type.Object({
    name: Type.String({
      minLength: 2,
      maxLength: 50,
      description: "Clients's name"
    })
  })
}

export const IndexSchema = {
  url: CLIENT_PATHS.index
}

export type StoreBody = Static<typeof StoreSchema.body>