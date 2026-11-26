import { FastifyRequest, FastifyReply } from "fastify";
import { arriveFleetTransport, courierTasks, deleteFleetTransport, departFleetTransport, dispatchFleetTransport, getCreateData, indexFleetTransport, recordTelemetryFleetTransport, returnFleetTransport, schedules, showFleetTransport, storeFleetTransport, updateFleetTransport } from "./service.js";
import parseId from "#commons/utils/id-parser.js";
import { CreateFleetTransportBody, FleetTransportParams, TelemetryFleetTransportBody, TelemetryFleetTransportParams, UpdateFleetTransportBody } from "./schema.js";

export async function indexFleetTransportHandler(request: FastifyRequest, reply: FastifyReply) {
  return reply.status(200).send({
    message: 'Fleet Transports retrieved successfully.',
    data: await indexFleetTransport(request.server)
  })
}

export async function createFleetTransportHandler(request: FastifyRequest<{ Querystring: { facilityId?: string } }>, reply: FastifyReply) {
  const queryFacilityId = request.query.facilityId ? parseId(request.query.facilityId) : undefined;
  const targetFacilityId = queryFacilityId || request.user.assignedFacilityId;

  return reply.status(200).send({
    message: 'Fleet Transport options retrieved successfully.',
    data: await getCreateData(request.server, targetFacilityId)
  })
}

export async function courierTasksFleetTransportHandler(request: FastifyRequest, reply: FastifyReply) {
  return reply.status(200).send({
    message: 'Fleet Tranport Courier Tasks retrieved successfully.',
    data: await courierTasks(request.server, request.user.courier.id)
  })
}

export async function schedulesFleetTransportHandler(request: FastifyRequest, reply: FastifyReply) {
  return reply.status(200).send({
    message: 'Fleet Transport Schedules retrieved successfully.',
    data: await schedules(request.server, request.user.assignedFacilityId)
  })
}

export async function storeFleetTransportHandler(request: FastifyRequest<{ Body: CreateFleetTransportBody }>, reply: FastifyReply) {
  const payload = {
    ...request.body,
    facilityId: request.user.assignedFacilityId,
  }

  return reply.code(201).send({
    message: 'Fleet Transport created successfully.',
    data: await storeFleetTransport(request.server, payload)
  })
}

export async function showFleetTransportHandler(request: FastifyRequest<{ Params: FleetTransportParams }>, reply: FastifyReply) {
  return reply.status(200).send({
    message: 'Fleet Transport retrieved successfully.',
    data: await showFleetTransport(request.server, parseId(request.params.id))
  })
}

export async function updateFleetTransportHandler(request: FastifyRequest<{ Body: UpdateFleetTransportBody; Params: FleetTransportParams }>, reply: FastifyReply) {
  return reply.code(200).send({
    message: 'Fleet Transport updated successfully.',
    data: await updateFleetTransport(request.server, parseId(request.params.id), request.body)
  })
}

export async function departFleetTransportHandler(request: FastifyRequest<{ Params: FleetTransportParams }>, reply: FastifyReply) {
  return reply.code(200).send(
    await departFleetTransport(request.server, parseId(request.params.id))
  )
}

export async function dispatchFleetTransportHandler(request: FastifyRequest<{ Params: FleetTransportParams }>, reply: FastifyReply) {
  return reply.status(200).send({
    message: 'Fleet Transport dispatched successfully.',
    data: await dispatchFleetTransport(request.server, parseId(request.params.id))
  })
}

export async function arriveFleetTransportHandler(request: FastifyRequest<{ Params: FleetTransportParams }>, reply: FastifyReply) {
  return reply.status(200).send({
    message: 'Fleet Transport arrived successfully.',
    data: await arriveFleetTransport(request.server, parseId(request.params.id))
  })
}

export async function returnFleetTransportHandler(request: FastifyRequest<{ Params: FleetTransportParams }>, reply: FastifyReply) {
  return reply.status(200).send({
    message: 'Fleet Transport returned successfully.',
    data: await returnFleetTransport(request.server, parseId(request.params.id))
  })
}

export async function deleteFleetTransportHandler(request: FastifyRequest<{ Params: FleetTransportParams }>, reply: FastifyReply) {
  await deleteFleetTransport(request.server, parseId(request.params.id))

  return reply.code(200).send({
    message: 'Fleet Transport deleted successfully.'
  })
}

export async function recordTelemetryFleetTransportHandler(request: FastifyRequest<{ Params: TelemetryFleetTransportParams; Body: TelemetryFleetTransportBody }>, reply: FastifyReply) {
  return reply.code(201).send({
    message: 'Fleet Transport Telemetry recorded successfully.',
    data: await recordTelemetryFleetTransport(request.server, parseId(request.params.id), request.body)
  })
}