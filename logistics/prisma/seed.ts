import { FacilityType, PrismaClient, ShipmentStatus } from '@prisma/client';
import { createFacility } from '../src/utils/factories.js';
import { prisma, disconnectPrisma } from '../src/prisma.js';


async function main() {
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE tracking_logs, parcels, couriers, delivery_boundaries, facilities, users CASCADE;
  `);

  const megaA = await createFacility({ name: 'Bulacan Mega Gateway' })

  const regionalA = await createFacility({
    name: 'Marilao Hub',
    type: FacilityType.RegionalHub
  })
  
  console.log(`Mega Gateway A: ${megaA.name}`)
  console.log(`Regional Hub A: ${regionalA.name}`)
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await disconnectPrisma();
  });