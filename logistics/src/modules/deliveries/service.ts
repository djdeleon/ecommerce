import { FastifyInstance } from "fastify";

export async function generateDeliveryCode(fastify: FastifyInstance): Promise<string> {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  
  const datePrefix = `DEL-${year}${month}${day}`;

  const countToday = await fastify.prisma.manifest.count({
    where: {
      code: {
        startsWith: datePrefix,
      },
    },
  });

  const sequenceNumber = String(countToday + 1).padStart(3, '0');

  return `${datePrefix}-${sequenceNumber}`;
}