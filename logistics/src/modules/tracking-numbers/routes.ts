import { FastifyInstance } from "fastify";
import { StoreBody, StoreSchema } from "./schema.js";
import { generateTrackingNumbers } from "./service.js";

export default async function trackingNumberRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: StoreBody }>(StoreSchema.url, { schema: StoreSchema }, async (req, rep) => {
    // TODO: middleware
    const apiKey = req.headers['x-api-key'] as any;

    const trackingNumbers = await generateTrackingNumbers({
      apiKey,
      size: req.body.size
    })

    return rep.status(201).send({
      message: 'Tracking Numbers generated.',
      data: trackingNumbers
    })
  })
}