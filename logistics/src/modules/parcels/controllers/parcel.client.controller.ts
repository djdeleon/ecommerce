import { FastifyReply, FastifyRequest } from 'fastify';
import { HandoffType, ShippingServiceType } from '@prisma/client';
import { createParcel } from '../domain/parcel.service.js';
import { CreateClientParcelBody } from '../dto/parcel.client.dto.js';

export async function createClientParcelController(
  req: FastifyRequest<{ Body: CreateClientParcelBody }>,
  rep: FastifyReply
) {
  const body = req.body;

  const senderRef = { storeId: body.storeId, externalOrderId: body.externalOrderId }

  const handoffType =
    body.handoffType === HandoffType.SenderDropoff
      ? HandoffType.SenderDropoff
      : HandoffType.CourierPickup;

  const shippingServiceType =
    body.shippingServiceType === 'E'
      ? ShippingServiceType.E
      : ShippingServiceType.R;

  const data = await createParcel(req.server, {
    ...senderRef,
    weightGrams: body.weightGrams,
    lengthCm: body.lengthCm,
    widthCm: body.widthCm,
    heightCm: body.heightCm,
    declaredValue: body.declaredValue,
    shippingServiceType,
    recipientName: body.recipientName,
    recipientPhone: body.recipientPhone,
    recipientAddress: body.recipientAddress,
    recipientBarangayId: body.recipientBarangayId,
    recipientCoordinates: body.recipientCoordinates,
    handoffType,
    originFacilityId: body.originFacilityId,
    actor: {
      role: 'System',
      storeId: body.storeId,
    },
  });

  return rep.code(201).send({
    message: 'Parcel created successfully.',
    data,
  });
}
