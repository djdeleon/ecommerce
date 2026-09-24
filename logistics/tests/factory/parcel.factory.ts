import { FacilityType, ShipmentStatus } from "@prisma/client";
import { createCourier, createFacility } from "#factory";
import { prisma } from "../../src/prisma.js";

export async function createParcel(overrides = {}) {
  const origin = await createFacility({
    name: 'Origin Mega Hub'
  })
  const destination = await createFacility({
    name: 'Destination Regional Hub',
    type: FacilityType.RegionalHub,
  })

  const courier = await createCourier({ currentFacilityId: origin.id });

  const store = await prisma.store.create({
    data: {
      name: "Store 1",
      contactNumber: "09225325754",
      address: "Bulacan 123 Main St.",
    }
  })

  await prisma.$executeRaw`
    UPDATE stores
    SET location = ST_SetSRID(ST_MakePoint(${14.22}, ${123.423}), 4326)
    WHERE id = ${store.id}
  `

  const randomSuffix = Math.floor(Math.random() * 10000);

  const parcel = await prisma.parcel.create({
    data: {
      trackingNumber: `TRK-${Date.now()}-${randomSuffix}`,
      externalOrderId: `${randomSuffix}`,
      weightGrams: 1500,
      originFacilityId: origin.id,
      destinationFacilityId: destination.id,
      currentFacilityId: origin.id,
      sortingCodeCache: `HUB-BUL-SKY-05`,
      routingPipelineCache: `BUL-NL`,
      storeId: store.id,
      customerName: "Doe John",
      customerAddress: "Marilao San Pablo 123 St.",
      customerPhone: "09244562453",
      assignedCourierId: courier.id,
      status: ShipmentStatus.PendingPickup,
      ...overrides,
    },
  });

  await prisma.$executeRaw`
    UPDATE parcels
    SET customer_location = ST_SetSRID(ST_MakePoint(${14.22}, ${123.423}), 4326)
    WHERE id = ${parcel.id}
  `

  return parcel
}
