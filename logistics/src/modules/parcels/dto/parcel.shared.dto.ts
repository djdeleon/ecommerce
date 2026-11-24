import { Type, Static } from '@sinclair/typebox';

export const BaseParcelBodySchema = Type.Object({
  // Dimensions & Valuation
  weightGrams: Type.Integer({ minimum: 1 }),
  lengthCm: Type.Number({ minimum: 0.1 }),
  widthCm: Type.Number({ minimum: 0.1 }),
  heightCm: Type.Number({ minimum: 0.1 }),
  declaredValue: Type.Number({ minimum: 0, default: 0 }),
  shippingServiceType: Type.Optional(
    Type.Union([Type.Literal('R'), Type.Literal('E')], { default: 'R' })
  ),

  // Recipient Details
  recipientName: Type.String({ minLength: 1 }),
  recipientPhone: Type.String({ minLength: 7 }),
  recipientAddress: Type.String({ minLength: 1 }),
  recipientBarangayId: Type.String({ minLength: 1, maxLength: 15 }),
  recipientCoordinates: Type.Optional(
    Type.Object({
      lat: Type.Number({ minimum: -90, maximum: 90 }),
      lng: Type.Number({ minimum: -180, maximum: 180 }),
    })
  ),

  // Handoff Method
  handoffType: Type.Union([
    Type.Literal('CourierPickup'),
    Type.Literal('SenderDropoff'),
  ]),
});

export const ParcelParamsSchema = Type.Object({
  id: Type.String(),
});

export type ParcelParams = Static<typeof ParcelParamsSchema>;
