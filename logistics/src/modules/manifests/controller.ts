import { FastifyRequest, FastifyReply } from "fastify";
import { accumulateManifest, arriveManifest, cancelManifest, completeManifest, createManifest, deleteManifest, dispatchManifest, indexManifest, showManifest, updateManifest } from "./service.js";
import { CreateManifestBody, ManifestParams, UpdateManifestBody } from "./schema.js";

export async function indexManifestHandler(request: FastifyRequest, reply: FastifyReply) {
  const data = await indexManifest(request.server, request.user.assignedFacilityId);

  return reply.status(200).send({
    message: 'Manifests retrieved.',
    data,
  });
}

export async function createManifestHandler(
  request: FastifyRequest<{ Body: CreateManifestBody }>,
  reply: FastifyReply
) {
  const data = await createManifest(request.server, request.user.assignedFacilityId, request.body);

  return reply.status(201).send({
    message: 'Manifest created successfully.',
    data,
  });
}

export async function showManifestHandler(
  request: FastifyRequest<{ Params: ManifestParams }>,
  reply: FastifyReply
) {
  const { code } = request.params;
  const manifest = await showManifest(request.server, code);

  return reply.status(200).send({
    message: 'Manifest retrieved successfully.',
    data: manifest,
  });
}

export async function updateManifestHandler(
  request: FastifyRequest<{ Params: ManifestParams; Body: UpdateManifestBody }>,
  reply: FastifyReply
) {
  const { code } = request.params;
  const updated = await updateManifest(request.server, code, request.body);

  return reply.status(200).send({
    message: 'Manifest updated successfully.',
    data: updated,
  });
}

export async function dispatchManifestHandler(
  request: FastifyRequest<{ Params: ManifestParams }>,
  reply: FastifyReply
) {
  const data = await dispatchManifest(request.server, request.params.code);

  return reply.send({
    message: 'Manifest dispatched successfully.',
    data,
  });
}

export async function accumulateManifestHandler(
  request: FastifyRequest<{ Params: ManifestParams }>,
  reply: FastifyReply
) {
  const data = await accumulateManifest(request.server, request.params.code);

  return reply.send({
    message: 'Manifest accumulating successfully.',
    data,
  });
}

export async function completeManifestHandler(
  request: FastifyRequest<{ Params: ManifestParams }>,
  reply: FastifyReply
) {
  const data = await completeManifest(request.server, request.params.code);

  return reply.send({
    message: 'Manifest completed successfully.',
    data,
  });
}

export async function arriveManifestHandler(
  request: FastifyRequest<{ Params: ManifestParams }>,
  reply: FastifyReply
) {
  const data = await arriveManifest(request.server, request.params.code);

  return reply.send({
    message: 'Manifest arrived successfully.',
    data,
  });
}

export async function cancelManifestHandler(
  request: FastifyRequest<{ Params: ManifestParams }>,
  reply: FastifyReply
) {
  const data = await cancelManifest(request.server, request.params.code);

  return reply.send({
    message: 'Manifest cancelled successfully.',
    data,
  });
}

export async function deleteManifestHandler(
  request: FastifyRequest<{ Params: ManifestParams }>,
  reply: FastifyReply
) {
  const { code } = request.params;
  await deleteManifest(request.server, code);

  return reply.status(200).send({
    message: 'Manifest deleted successfully.',
  });
}