import { FastifyReply, FastifyRequest } from 'fastify';

export async function requireFacility(request: FastifyRequest, reply: FastifyReply) {
  const manager = (request as any).user;
  const facilityId = manager?.assignedFacilityId;

  if (!facilityId) {
    return reply.status(400).send({
      message: 'Access denied: User is not assigned to any facility.',
    });
  }
}