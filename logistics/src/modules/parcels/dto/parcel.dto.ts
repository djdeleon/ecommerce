import { Type, Static } from '@sinclair/typebox';
import { BaseParcelBodySchema } from './parcel.shared.dto.js';

export const CreateParcelBodySchema = Type.Intersect([
  BaseParcelBodySchema,
  Type.Object({
    customerId: Type.Integer({ minimum: 1 }),
    originFacilityId: Type.Optional(Type.Integer({ minimum: 1 })),
  }),
]);

export const CreateParcelSchema = {
  body: CreateParcelBodySchema,
};

export type CreateParcelBody = Static<typeof CreateParcelBodySchema>;
