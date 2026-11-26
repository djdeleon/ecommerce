import { Type, Static } from '@sinclair/typebox';
import { BaseParcelBodySchema } from './parcel.shared.dto.js';

export const CreateClientParcelBodySchema = Type.Intersect([
  BaseParcelBodySchema,
  Type.Object({
    storeId: Type.Integer({ minimum: 1 }),
    externalOrderId: Type.Optional(Type.String({ minLength: 1 })),
    originFacilityId: Type.Optional(Type.Integer({ minimum: 1 })),
  }),
]);

export const CreateClientParcelSchema = {
  body: CreateClientParcelBodySchema,
};

export type CreateClientParcelBody = Static<typeof CreateClientParcelBodySchema>;
