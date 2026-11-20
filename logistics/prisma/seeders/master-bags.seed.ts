import { FastifyInstance } from "fastify";
import { MasterBagStatus } from "@prisma/client";
import { createMasterBag } from "../../tests/factory/master-bag.factory.js";

export async function seedMasterBags(app: FastifyInstance, count: number = 15) {
  console.log(`Seeding ${count} random master bags...`);

  const sortingBatches = await app.prisma.sortingBatch.findMany({ take: 5 });
  const facilities = await app.prisma.facility.findMany({ take: 5 });

  if (sortingBatches.length === 0 || facilities.length === 0) {
    console.log("Skipping Master Bags seeding: No SortingBatches or Facilities found.");
    return;
  }

  const statuses: MasterBagStatus[] = ['Open', 'Full', 'Sealed', 'Dispatched', 'Delivered', 'Unbagged'];

  for (let i = 1; i <= count; i++) {
    const randomBatch = sortingBatches[Math.floor(Math.random() * sortingBatches.length)];
    const randomCurrentFacility = facilities[Math.floor(Math.random() * facilities.length)];
    const randomNextFacility = facilities[Math.floor(Math.random() * facilities.length)];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

    await createMasterBag(app, {
      sortingBatchId: randomBatch.id,
      currentFacilityId: randomCurrentFacility.id,
      nextFacilityId: randomNextFacility.id,
      totalWeight: Math.floor(500 + Math.random() * 15000), // in grams (500g to 15kg)
      totalCbm: parseFloat((Math.random() * 0.5).toFixed(4)),     // cubic meters
      totalParcels: Math.floor(1 + Math.random() * 25),          // 1 to 25 parcels
      status: randomStatus,
    });
  }

  console.log(`Successfully seeded ${count} master bags!`);
}