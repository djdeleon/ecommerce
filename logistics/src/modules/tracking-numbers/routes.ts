import { FastifyInstance } from "fastify";
import { StoreBody, StoreSchema } from "./schema.js";
import { generateTrackingNumbers } from "./service.js";
import { trackingNumbers } from "./paths.js";

export default async function routes(fastify: FastifyInstance) {
  fastify.get(trackingNumbers.index, async (req, rep) => {

    const data = await fastify.prisma.trackingNumber.findMany({
      include: { client: true }
    })

    return rep.status(200).send({
      message: 'Tracking numbers retrieved successfully.',
      data
    });
  });

  fastify.post<{ Body: StoreBody }>(trackingNumbers.store, { schema: StoreSchema }, async (req, rep) => {
    // TODO: middleware
    const apiKey = req.headers['x-api-key'] as any;

    const trackingNumbers = await generateTrackingNumbers({
      apiKey,
      size: req.body.size
    })

    return rep.status(201).send({
      message: 'Tracking Numbers generated successfully.',
      data: trackingNumbers
    })
  })

  fastify.get<{ Params: { number: string } }>(trackingNumbers.show.url, async (req, rep) => {
    const { number } = req.params;

    const data = await fastify.prisma.trackingNumber.findUniqueOrThrow({
      where: { number }
    })

    return rep.status(200).send({
      message: 'Tracking number details retrieved successfully.',
      data
    });
  });
}