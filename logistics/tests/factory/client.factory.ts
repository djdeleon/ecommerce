import { encryptSecret } from "#commons/utils/crypto.js";
import crypto from "crypto"
import { FastifyInstance } from "fastify";

export async function createClient(overrides = {}) {
  const app = (globalThis as any).app as FastifyInstance

  const webhookUrl = 'http://reverse-proxy/api/v1/logistics/webhook'
  const apiKey = 'apk_' + crypto.randomBytes(16).toString('hex')
  const apiTextSecret = crypto.randomBytes(32).toString('hex')
  const webhookTextSecret = crypto.randomBytes(32).toString('hex')
  const encryptedApiSecret = encryptSecret(apiTextSecret)
  const encryptedWebhookSecret = encryptSecret(webhookTextSecret)

  return app.prisma.client.create({
    data: {
      name: 'Laravel E-Commerce PH',
      apiKey,
      apiSecret: encryptedApiSecret,
      webhookUrl: webhookUrl,
      webhookSecret: encryptedWebhookSecret,
      ...overrides
    }
  })
}
