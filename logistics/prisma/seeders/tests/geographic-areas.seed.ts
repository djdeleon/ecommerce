import { FastifyInstance } from "fastify";

export async function seedGeo(app: FastifyInstance) {
  await app.prisma.region.upsert({
    where: { id: '1300000000' },
    update: {},
    create: {
      id: '1300000000',
      name: 'National Capital Region (NCR)',
      code: 'NCR'
    }
  });

  await app.prisma.city.upsert({
    where: { id: '1380600000' },
    update: {},
    create: { id: '1380600000', name: 'Manila', code: 'MNL' }
  });

  await app.prisma.city.upsert({
    where: { id: '1381000000' },
    update: {},
    create: { id: '1381000000', name: 'Parañaque', code: 'PAR' }
  });

  await app.prisma.barangay.upsert({
    where: { id: '1381000001' },
    update: {},
    create: { id: '1381000001', name: 'Baclaran', code: 'NCR-MTR-PAR-001', cityId: '1381000000' }
  });

  await app.prisma.city.upsert({
    where: { id: '1380700000' },
    update: {},
    create: { id: '1380700000', name: 'Marikina', code: 'MAR' }
  });

  await app.prisma.barangay.upsert({
    where: { id: '1380700001' },
    update: {},
    create: { id: '1380700001', name: 'Barangka', code: 'NCR-MTR-MAR-001', cityId: '1380700000' }
  });
}