import { ManifestStatus } from "@prisma/client";
import { Static, Type } from "@sinclair/typebox"

export const CreateManifestBodySchema = Type.Object({
  sectorId: Type.Number(),
  courierId: Type.Union([Type.Number(), Type.Null()]),
  vehicleId: Type.Number(),
  currentWeightGrams: Type.Number(),
  currentVolumeCbm: Type.Number(),
  scheduledTime: Type.String(),
  parcelIds: Type.Array(Type.Number()),
});

export const UpdateManifestBodySchema = Type.Partial(
  Type.Object({
    status: Type.Enum(ManifestStatus),
    currentWeightGrams: Type.Number(),
    currentVolumeCbm: Type.Number(),
  })
);

export const CreateManifestSchema = {
  body: CreateManifestBodySchema,
};

export const ManifestParamsSchema = Type.Object({
  code: Type.String(),
});

export const ManifestRouteParamsSchema = {
  params: ManifestParamsSchema,
};

export const UpdateManifestSchema = {
  params: ManifestParamsSchema,
  body: UpdateManifestBodySchema,
};

export type CreateManifestBody = Static<typeof CreateManifestBodySchema>;
export type ManifestParams = Static<typeof ManifestParamsSchema>;
export type UpdateManifestBody = Static<typeof UpdateManifestBodySchema>;