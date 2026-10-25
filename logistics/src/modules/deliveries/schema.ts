import { Type, Static } from "@sinclair/typebox";

export const DELIVERY_PATHS = {
  index: '/deliveries',
  store: '/deliveries',
  dispatch: '/deliveries/:deliveryCode/dispatch',
  completed: '/deliveries/:deliveryCode/completed',
  arrived: '/deliveries/:deliveryCode/arrived',
} as const;

export const CreateDeliverySchema = {
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

export type CreateDeliveryBody = Static<typeof CreateDeliverySchema.body>;