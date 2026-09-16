import { CourierStatus, NetworkType, ShipmentStatus, UserRole } from "@prisma/client";
import { prisma } from "../prisma.js";
import { generateEventDescription } from "../logisticsEventDictionary.js";

/**
 * Network Factory
 */
export async function createNetwork(overrides = {}) {
  const randomSuffix = Math.floor(Math.random() * 10000);

  return await prisma.network.create({
    data: {
      name: `Test Hub ${randomSuffix}`,
      code: `HUB-${randomSuffix}`,
      address: `${randomSuffix} Test Street, Manila`,
      type: NetworkType.SortingHub,
      latitude: "14.59",
      longitude: "120.98",
      ...overrides,
    }
  })
}

/**
 * Courier Factory Helper
 * Automatically creates a parent Network if one isn't provided!
 */
export async function createCourier(overrides = {}, withNetwork = false) {
  const randomSuffix = Math.floor(Math.random() * 10000);
  let networkId = (overrides as any).currentNetworkId;

  // If no network ID was passed, create a parent network automatically (like Laravel does!)
  if (!networkId && withNetwork === true) {
    const network = await createNetwork();
    networkId = network.id;
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
      currentNetworkId: networkId,
      ...overrides,
    },
    include: {
      currentNetwork: true,
      user: true
    }
  });
}

/**
 * Shipment Factory Helper
 * Automatically creates parent Network and Courier if needed!
 */
export async function createShipment(overrides = {}, withNetwork = false, withCourier = false) {
  let networkId = (overrides as any).currentNetworkId;
  let courierId = (overrides as any).assignedCourierId;

  if (!networkId && withNetwork === true) {
    const network = await createNetwork();
    networkId = network.id;
  }

  if (!courierId && withCourier === true) {
    const courier = await createCourier({ currentNetworkId: networkId });
    courierId = courier.id;
  }

  const randomSuffix = Math.floor(Math.random() * 10000);

  return await prisma.shipment.create({
    data: {
      trackingNumber: `TRK-${Date.now()}-${randomSuffix}`,
      externalOrderId: `EXT-${randomSuffix}`,
      providerName: "J&T Express",
      senderName: "John Doe",
      senderPhoneNumber: "09111111111",
      senderAddress: "Sender Address",
      recipientName: "Jane Doe",
      recipientPhoneNumber: "09222222222",
      recipientAddress: "Recipient Address",
      recipientLatitude: "14.60",
      recipientLongitude: "120.99",
      weightKg: "1.50",
      status: ShipmentStatus.PendingPickup,
      currentNetworkId: networkId,
      assignedCourierId: courierId,
      ...overrides,
    },
  });
}

export async function createTrackingLog(shipmentId: number, status: ShipmentStatus = ShipmentStatus.PendingPickup) {
  const description = generateEventDescription({ status })

  await prisma.shipment.update({
    where: { id: shipmentId },
    data: {
      status
    }
  })

  return await prisma.trackingLog.create({
    data: {
      shipmentId: shipmentId,
      status,
      description: description,
    }
  })
}