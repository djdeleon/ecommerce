import { FastifyInstance } from "fastify";
import { encryptSecret } from "#commons/utils/crypto.js";
import crypto from "crypto"

export async function dashboardData(fastify: FastifyInstance) {
  return await fastify.prisma.client.findMany()
}

export async function createClient(fastify: FastifyInstance, name: string) {
  const webhookUrl = 'http://reverse-proxy/api/v1/logistics/webhook'
  const apiKey = 'apk_' + crypto.randomBytes(16).toString('hex')
  const apiTextSecret = crypto.randomBytes(32).toString('hex')
  const webhookTextSecret = crypto.randomBytes(32).toString('hex')
  const encryptedApiSecret = encryptSecret(apiTextSecret)
  const encryptedWebhookSecret = encryptSecret(webhookTextSecret)

  return fastify.prisma.client.create({
    data: {
      name: name,
      apiKey,
      apiSecret: encryptedApiSecret,
      webhookUrl: webhookUrl,
      webhookSecret: encryptedWebhookSecret
    }
  })
}