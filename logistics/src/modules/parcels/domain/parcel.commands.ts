import { HandoffType, ShippingServiceType } from '@prisma/client';

export type ParcelActor =
  | { role: 'Admin'; userId: number }
  | { role: 'Customer'; customerId: number }
  | { role: 'System'; storeId: number };

export type ParcelSenderRef =
  | { storeId: number; externalOrderId?: string }
  | { customerId: number };

export type CreateParcelCommand = ParcelSenderRef & {
  weightGrams: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  declaredValue: number;
  shippingServiceType: ShippingServiceType;
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  recipientBarangayId: string;
  recipientCoordinates?: { lat: number; lng: number };
  handoffType: HandoffType;
  originFacilityId?: number;
  actor: ParcelActor;
};
