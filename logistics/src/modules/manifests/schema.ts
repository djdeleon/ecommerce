import { Static, Type } from "@sinclair/typebox"

export const MANIFEST_PATHS = {
  index: '/manifests',
  store: '/manifests',
  dispatch: '/manifests/:manifestCode/dispatch',
  complete: '/manifests/:manifestCode/complete',
  arrive: '/manifests/:manifestCode/arrive',
} as const;

export const CreateManifestSchema = {
  body: Type.Object({
    sectorId: Type.Number(),
    courierId: Type.Union([Type.Number(), Type.Null()]),
    vehicleId: Type.Number(),
    currentWeightGrams: Type.Number(),
    currentVolumeCbm: Type.Number(),
    scheduledTime: Type.String(),
    parcelIds: Type.Array(Type.Number()),
  }),
};

export type CreateManifestBody = Static<typeof CreateManifestSchema.body>;