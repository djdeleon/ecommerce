import { encryptSecret } from "#commons/utils/crypto.js";
import crypto from "crypto"
import { prisma } from "#commons/database/prisma.js";

export async function dashboardData() {
  return await prisma.client.findMany()
}

export async function createClient(name: string) {
  const webhookUrl = 'http://reverse-proxy/api/v1/logistics/webhook'
  const apiKey = 'apk_' + crypto.randomBytes(16).toString('hex')
  const plainTextSecret = crypto.randomBytes(32).toString('hex')
  const webhookTextSecret = crypto.randomBytes(32).toString('hex')
  const encryptedApiSecret = encryptSecret(plainTextSecret)
  const encryptedWebhookSecret = encryptSecret(webhookTextSecret)

  console.log(`SAVE: ${plainTextSecret}`)

  return prisma.client.create({
    data: {
      name,
      apiKey,
      apiSecret: encryptedApiSecret,
      webhookUrl: webhookUrl,
      webhookSecret: encryptedWebhookSecret
    }
  })
}