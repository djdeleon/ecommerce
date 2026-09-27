import { FastifyInstance } from "fastify";
import { StoreBody, StoreSchema } from "./schema.js";
import { generateTrackingNumbers } from "./service.js";
import parseId from "#commons/utils/id-parser.js";

export default async function trackingNumberRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: StoreBody }>(StoreSchema.url, { schema: StoreSchema }, async (req, rep) => {
    const trackingNumbers = await generateTrackingNumbers({
      clientId: parseId(req.body.clientId),
      size: req.body.size
    })

    return rep.status(201).send({
      message: 'Tracking Numbers generated.',
      data: trackingNumbers
    })
  })
}