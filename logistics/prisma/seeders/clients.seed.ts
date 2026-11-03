import { PrismaClient } from '@prisma/client';
import { encryptSecret } from "../../src/commons/utils/crypto.js";
import crypto from "crypto";
import { prisma } from '#commons/database/prisma.js';

async function main() {
  console.log('Seeding 10 random clients...');

  for (let i = 1; i <= 10; i++) {
    const apiKey = 'apk_' + crypto.randomBytes(16).toString('hex');
    const apiTextSecret = crypto.randomBytes(32).toString('hex');
    const webhookTextSecret = crypto.randomBytes(32).toString('hex');

    await prisma.client.create({
      data: {
        name: `Client Company ${i}`,
        apiKey,
        apiSecret: encryptSecret(apiTextSecret),
        webhookUrl: 'http://reverse-proxy/api/v1/logistics/webhook',
        webhookSecret: encryptSecret(webhookTextSecret),
      },
    });
  }
  console.log('Successfully seeded 10 clients!');
}

main().finally(() => prisma.$disconnect());