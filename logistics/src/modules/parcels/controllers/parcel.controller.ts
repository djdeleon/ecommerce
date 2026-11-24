import { FastifyReply, FastifyRequest } from 'fastify';
import { HandoffType, ShippingServiceType, UserRole } from '@prisma/client';
import { createParcel } from '../domain/parcel.service.js';
import { CreateParcelBody } from '../dto/parcel.dto.js';

export async function createParcelController(
  req: FastifyRequest<{ Body: CreateParcelBody }>,
  rep: FastifyReply
) {
  const body = req.body;

  const senderRef = { customerId: body.customerId };

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
      role: UserRole.Customer,
      customerId: body.customerId,
    },
  });

  return rep.code(201).send({
    message: 'Parcel created successfully.',
    data,
  });
}
