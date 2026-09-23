import { CourierStatus, FacilityType, ShipmentStatus, UserRole } from "@prisma/client";
import { prisma } from "../prisma.js";
import { generateEventDescription } from "../logisticsEventDictionary.js";

/**
 * Facility Factory
 */
export async function createFacility(overrides = {}) {
  const randomSuffix = Math.floor(Math.random() * 10000);

  const latitude = (overrides as any).latitude ?? 120.98
  const longitude = (overrides as any).longitude ?? 14.59

  const { longitude: _, latitude: __, ...cleanOverrides } = overrides as any;

  const facility = await prisma.facility.create({
    data: {
      name: `Test Hub ${randomSuffix}`,
      type: FacilityType.RegionalHub,
      sortingCode: `HUB-${randomSuffix}`,
      address: `${randomSuffix} Test Street, Manila`,
      ...cleanOverrides,
    }
  })

  await prisma.$executeRaw`
    UPDATE facilities
    SET location = ST_SetSRID(ST_MakePoint(${parseFloat(longitude)}, ${parseFloat(latitude)}), 4326)
    WHERE id = ${facility.id}
  `

  return facility
}

/**
 * Courier Factory Helper
 * Automatically creates a parent Facility if one isn't provided!
 */
export async function createCourier(overrides = {}, withNetwork = false) {
  const randomSuffix = Math.floor(Math.random() * 10000);
  let facilityId = (overrides as any).currentFacilityId;

  if (!facilityId && withNetwork === true) {
    const facility = await createFacility();
    facilityId = facility.id;
  }

  const user = await prisma.user.create({
    data: {
      email: `user-${randomSuffix}@example.com`,
      password: 'secretPassword123',
      role: UserRole.Courier
    }
  })

  return await prisma.courier.create({
    data: {
      userId: user.id,
      firstName: "Fastification",
      lastName: "JavaScript",
      phoneNumber: `09${Math.floor(100000000 + Math.random() * 900000000)}`, // Random 11-digit string
      vehicleType: "truck",
      plateNumber: `ABC-${randomSuffix}`,
      status: CourierStatus.Available,
      currentFacilityId: facilityId,
      ...overrides,
    },
    include: {
      currentFacility: true,
      user: true
    }
  });
}

export async function createStore(overrides = {}) {
  const longitude = (overrides as any).longitude ?? 14.59
  const latitude = (overrides as any).latitude ?? 120.98

  const store = await prisma.store.create({
    data: {
      name: "Store Factory",
      contactNumber: "09225356435",
      address: "Bulacan 123 Main St.",
      ...overrides
    }
  })

  await prisma.$executeRaw`
    UPDATE stores
    SET location = ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)
    WHERE id = ${store.id}
  `

  return store
}

/**
 * Parcel Factory Helper
 * Automatically creates parent Facility and Courier if needed!
 */
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

export async function createTrackingLog(parcelId: number, status: ShipmentStatus = ShipmentStatus.PendingPickup) {
  const description = generateEventDescription({ status })

  const parcel = await prisma.parcel.update({
    where: { id: parcelId },
    data: {
      status
    }
  })

  return await prisma.trackingLog.create({
    data: {
      parcelId: parcel.id,
      status,
      description: description,
    }
  })
}