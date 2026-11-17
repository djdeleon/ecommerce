import { FastifyInstance } from "fastify";
import { createClient } from "../../tests/factory/client.factory.js";

export async function seedClients(app: FastifyInstance, count: number = 10) {
  console.log(`Seeding ${count} random clients...`);

  for (let i = 1; i <= count; i++) {
    await createClient(app, {
      name: `Client Company ${Math.floor(Math.random() * 100000)}`,
    });
  }
  
  console.log(`Successfully seeded ${count} clients!`);
}