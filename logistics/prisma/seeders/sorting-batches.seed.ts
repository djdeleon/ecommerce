import { FastifyInstance } from "fastify";
import { createSortingBatch } from "../../tests/factory/sorting-batch.factory.js";

export async function seedSortingBatches(app: FastifyInstance, count: number = 10) {
  console.log(`Seeding ${count} random sorting batches...`);

  const facilities = await app.prisma.facility.findMany();

  if (facilities.length === 0) {
    console.log("Skipping Sorting Batches seeding: No Facilities found.");
    return;
  }

  const shifts: ('NIGHT' | 'MORNING')[] = ['NIGHT', 'MORNING'];

  for (let i = 1; i <= count; i++) {
    const randomFacility = facilities[Math.floor(Math.random() * facilities.length)];
    const randomShift = shifts[Math.floor(Math.random() * shifts.length)];

    await createSortingBatch(app, {
      facilityId: randomFacility.id,
      shift: randomShift,
    });
  }

  console.log(`Successfully seeded ${count} sorting batches!`);
}