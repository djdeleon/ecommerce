import { Static, Type } from "@sinclair/typebox"

export const MANIFEST_PATHS = {
  index: '/manifests',
  store: '/manifests',
} as const;

export const CreateManifestSchema = {
  body: Type.Object({
    sectorId: Type.Number(),
    vehicleId: Type.Number(),
    currentWeightGrams: Type.Number(),
    currentVolumeCbm: Type.Number(),
    parcelIds: Type.Array(Type.Number()),
  }),
};

export type CreateManifestBody = Static<typeof CreateManifestSchema.body>;