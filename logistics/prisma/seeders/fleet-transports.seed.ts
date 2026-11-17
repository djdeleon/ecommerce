import { FastifyInstance } from "fastify";
import { createFleetTransport } from "../../tests/factory/fleet-transport.factory.js";
import { FleetTransportType } from "@prisma/client";

export async function seedFleetTransports(app: FastifyInstance, count: number = 15) {
  console.log(`Seeding ${count} Fleet Transports linked to real facilities...`);

  const targetCodes = ["GW-MNL-01", "DC-PAR-01", "BR-MAR-01"];
  const facilities = await app.prisma.facility.findMany({
    where: { code: { in: targetCodes } },
    include: {
      vehicles: true,
      users: {
        where: { courier: { isNot: null } },
        include: { courier: true }
      },
      sourceLegs: true
    }
  });

  if (facilities.length === 0) {
    console.warn("⚠️ No target facilities found. Make sure seedFacilities runs before this.");
    return;
  }

  const types = Object.values(FleetTransportType);

  for (let i = 0; i < count; i++) {
    const facility = facilities[i % facilities.length];
    
    const scheduledFor = types[i % types.length];

    const vehicleId = facility.vehicles[0]?.id;
    const courierId = facility.users[0]?.courier?.id;
    const networkLegId = scheduledFor === FleetTransportType.LineHaul ? facility.sourceLegs[0]?.id : null;

    await createFleetTransport(app, {
      facilityId: facility.id,
      vehicleId: vehicleId, 
      courierId: courierId,
      networkLegId: networkLegId,
      scheduledTime: new Date(Date.now() + (i + 1) * 3600000),
      scheduledFor: scheduledFor,
    });
  }

  console.log(`Successfully seeded ${count} Fleet Transports linked to facilities!`);
}