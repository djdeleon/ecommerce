import { FastifyRequest, FastifyReply } from "fastify";
import { accumulateManifest, arriveManifest, cancelManifest, completeManifest, createManifest, deleteManifest, dispatchManifest, indexManifest, showManifest, updateManifest } from "./service.js";
import { CreateManifestBody, ManifestParams, UpdateManifestBody } from "./schema.js";

export async function indexManifestHandler(request: FastifyRequest, reply: FastifyReply) {
  return reply.status(200).send({
    message: 'Manifests retrieved successfully.',
    data: await indexManifest(request.server, request.user.assignedFacilityId)
  })
}

export async function createManifestHandler(request: FastifyRequest<{ Body: CreateManifestBody }>, reply: FastifyReply) {
  return reply.status(201).send({
    message: 'Manifest created successfully.',
    data: await createManifest(request.server, request.user.assignedFacilityId, request.body)
  })
}

export async function showManifestHandler(request: FastifyRequest<{ Params: ManifestParams }>, reply: FastifyReply) {
  return reply.status(200).send({
    message: 'Manifest retrieved successfully.',
    data: await showManifest(request.server, request.params.code)
  })
}

export async function updateManifestHandler(request: FastifyRequest<{ Params: ManifestParams; Body: UpdateManifestBody }>, reply: FastifyReply) {
  return reply.status(200).send({
    message: 'Manifest updated successfully.',
    data: await updateManifest(request.server, request.params.code, request.body)
  })
}

export async function dispatchManifestHandler(request: FastifyRequest<{ Params: ManifestParams }>, reply: FastifyReply) {
  return reply.send({
    message: 'Manifest dispatched successfully.',
    data: await dispatchManifest(request.server, request.params.code)
  })
}

export async function accumulateManifestHandler(request: FastifyRequest<{ Params: ManifestParams }>, reply: FastifyReply) {
  return reply.send({
    message: 'Manifest accumulating successfully.',
    data: await accumulateManifest(request.server, request.params.code)
  })
}

export async function completeManifestHandler(request: FastifyRequest<{ Params: ManifestParams }>, reply: FastifyReply) {
  return reply.send({
    message: 'Manifest completed successfully.',
    data: await completeManifest(request.server, request.params.code)
  })
}

export async function arriveManifestHandler(request: FastifyRequest<{ Params: ManifestParams }>, reply: FastifyReply) {
  return reply.send({
    message: 'Manifest arrived successfully.',
    data: await arriveManifest(request.server, request.params.code)
  })
}

export async function cancelManifestHandler(request: FastifyRequest<{ Params: ManifestParams }>, reply: FastifyReply) {
  return reply.send({
    message: 'Manifest cancelled successfully.',
    data: await cancelManifest(request.server, request.params.code)
  })
}

export async function deleteManifestHandler(request: FastifyRequest<{ Params: ManifestParams }>, reply: FastifyReply) {
  await deleteManifest(request.server, request.params.code);

  return reply.status(200).send({
    message: 'Manifest deleted successfully.'
  })
}