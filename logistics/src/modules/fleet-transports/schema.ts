import { Type, Static } from "@sinclair/typebox";

export const StatusEnum = Type.Union([
  Type.Literal('Accumulation'),
  Type.Literal('LineHaul'),
  Type.Literal('Delivery'),
]);

const IdParamSchema = Type.Object({
  id: Type.String(),
});

export const Schema = Type.Object({
  id: Type.Integer({ minimum: 1 }),
  courierId: Type.Optional(Type.Integer({ minimum: 1 })),
  vehicleId: Type.Integer({ minimum: 1 }),
  networkLegId: Type.Optional(Type.Integer({ minimum: 1 })),
  scheduledFor: Type.Optional(StatusEnum),
  scheduledTime: Type.String({ format: 'date-time' }),
  masterBagIds: Type.Optional(Type.Array(Type.Number())),
  createdAt: Type.String({ format: 'date-time' }),
  updatedAt: Type.String({ format: 'date-time' }),
});

export const CreateBodySchema = Type.Omit(Schema, ['id', 'createdAt', 'updatedAt']);
export const UpdateBodySchema = Type.Partial(CreateBodySchema);

export const TelemetryBodySchema = Type.Object({
  longitude: Type.Number(),
  latitude: Type.Number(),
  speed: Type.Optional(Type.Number()),
  heading: Type.Optional(Type.Number()),
});

// Route-level Fastify schemas
export const CreateFleetTransportSchema = { body: CreateBodySchema };
export const UpdateFleetTransportSchema = { body: UpdateBodySchema, params: IdParamSchema };
export const DeleteFleetTransportSchema = { params: IdParamSchema };
export const TelemetryFleetTransportSchema = { params: IdParamSchema, body: TelemetryBodySchema };

// Inferred TypeScript types
export type CreateFleetTransportBody = Static<typeof CreateBodySchema>;
export type UpdateFleetTransportBody = Static<typeof UpdateBodySchema>;
export type FleetTransportParams = Static<typeof IdParamSchema>;
export type TelemetryFleetTransportBody = Static<typeof TelemetryBodySchema>;
export type TelemetryFleetTransportParams = Static<typeof IdParamSchema>;