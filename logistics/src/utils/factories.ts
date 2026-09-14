import { CourierStatus, NetworkType, ShipmentStatus } from "@prisma/client";
import { prisma } from "../prisma.js";

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
export async function createCourier(overrides = {}) {
  let networkId = (overrides as any).currentNetworkId;

  // If no network ID was passed, create a parent network automatically (like Laravel does!)
  if (!networkId) {
    const network = await createNetwork();
    networkId = network.id;
  }

  const randomSuffix = Math.floor(Math.random() * 10000);

  return await prisma.courier.create({
    data: {
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
        currentNetwork: true
    }
  });
}

/**
 * Shipment Factory Helper
 * Automatically creates parent Network and Courier if needed!
 */
export async function createShipment(overrides = {}) {
  let networkId = (overrides as any).currentNetworkId;
  let courierId = (overrides as any).assignedCourierId;

  if (!networkId) {
    const network = await createNetwork();
    networkId = network.id;
  }

  if (!courierId) {
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