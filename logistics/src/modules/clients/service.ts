import { encryptSecret } from "#commons/utils/crypto.js";
import crypto from "crypto"
import { prisma } from "#commons/database/prisma.js";

export async function dashboardData() {
  return await prisma.client.findMany()
}

export async function storeClient(name: string) {
  const webhookUrl = 'http://reverse-proxy/api/v1/logistics/webhook'
  const apiKey = 'apk_' + crypto.randomBytes(16).toString('hex')
  const plainTextSecret = crypto.randomBytes(32).toString('hex')
  const webhookTextSecret = crypto.randomBytes(32).toString('hex')
  const encryptedApiSecret = encryptSecret(plainTextSecret)
  const encryptedWebhookSecret = encryptSecret(webhookTextSecret)

  console.log(`SAVE: ${plainTextSecret}`)

  const client = await prisma.client.create({
    data: {
      name,
      apiKey,
      apiSecret: encryptedApiSecret,
      webhookUrl: webhookUrl,
      webhookSecret: encryptedWebhookSecret
    }
  })

  return { client, plainTextSecret }
}

export async function getClientById(clientId: number) {
  return await prisma.client.findUniqueOrThrow({
    where: { id: clientId }
  })
}

export async function updateClient(clientId: number, data: { name?: string; webhookUrl?: string; isActive?: boolean }) {
  return await prisma.client.update({
    where: { id: clientId },
    data
  })
}

export async function destroyClient(clientId: number) {
  const parcelsCount = await prisma.parcel.count({
    where: {
      trackingNumberRel: {
        clientId: clientId
      }
    }
  })

  if (parcelsCount > 0) {
    throw {
      statusCode: 400,
      error: "Conflict",
      message: "Cannot delete client with existing shipment records. Please deactivate the client instead to preserve history."
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.trackingNumber.deleteMany({
      where: { clientId }
    })
    await tx.client.delete({
      where: { id: clientId }
    })
  })
}