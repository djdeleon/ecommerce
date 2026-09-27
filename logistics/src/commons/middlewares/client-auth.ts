import { calculateDigest, decryptSecret } from "#commons/utils/crypto.js"
import { FastifyReply, FastifyRequest } from "fastify"
import crypto from "crypto"

export default async function parcelAuth(req: FastifyRequest, rep: FastifyReply) {
  const { prisma } = req.server

  const apiKey = req.headers['x-api-key'] as string
  const incomingSignature = req.headers['x-signature'] as string

  if (!apiKey || !incomingSignature) {
    return rep.status(401).send({ error: 'Unauthorized: Missing security headers.' })
  }

  const client = await prisma.client.findUnique({
    where: { apiKey }
  })

  if (!client || !client.isActive) {
    return rep.status(401).send({ error: 'Unauthorized: Invalid or deactivated API Client' })
  }

  const plainTextSecret = decryptSecret(client.apiSecret)
  const rawBodyString = JSON.stringify(req.body)

  const expectedSignature = calculateDigest(rawBodyString, plainTextSecret)

  const isMatch = crypto.timingSafeEqual(
    Buffer.from(incomingSignature, 'utf8'),
    Buffer.from(expectedSignature, 'utf8')
  )

  if (!isMatch) {
    return rep.status(401).send({ error: 'Unauthorized: Signature mismatch.' })
  }

  return (req as any).clientId = client.id
}