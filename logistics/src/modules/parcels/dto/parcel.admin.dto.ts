import { Type, Static } from '@sinclair/typebox';
import { BaseParcelBodySchema } from './parcel.shared.dto.js';

const StoreSenderSchema = Type.Object({
  storeId: Type.Integer({ minimum: 1 }),
  externalOrderId: Type.Optional(Type.String({ minLength: 1 })),
});

const CustomerSenderSchema = Type.Object({
  customerId: Type.Integer({ minimum: 1 }),
});

export const CreateAdminParcelBodySchema = Type.Intersect([
  BaseParcelBodySchema,
  Type.Union([StoreSenderSchema, CustomerSenderSchema]),
  Type.Object({
    originFacilityId: Type.Optional(Type.Integer({ minimum: 1 })),
  }),
]);

export const CreateAdminParcelSchema = {
  body: CreateAdminParcelBodySchema,
};

export type CreateAdminParcelBody = Static<typeof CreateAdminParcelBodySchema>;
