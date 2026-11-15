import { FastifyInstance } from "fastify";
import { beforeAll, describe, expect, test } from "vitest";
import { seedMasterInfrustructure } from "../../prisma/seeders/tests/master-infrastructure-tests.seed.js";
import { createParcel } from "../factory/parcel.factory.js";
import { Courier, CourierStatus, Delivery, DeliveryStatus, ShipmentStatus, UserRole } from "@prisma/client";
import { createUser } from "../factory/user.factory.js";
import { createDelivery } from "../factory/delivery.factory.js";
import { deliveries } from "../../src/modules/deliveries/paths.js";
import { parcels } from "../../src/modules/parcels/paths.js";

describe('Distribution Phase (Delivery - Last Mile)', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = (globalThis as any).app as FastifyInstance
  })

  test('a delivery has its own dashboard UI', async () => {
    await seedMasterInfrustructure(app)

    const facility = await app.prisma.facility.findFirstOrThrow({
      where: { code: "BR-MAR-01" },
      include: {
        sectors: true,
        vehicles: true,
      }
    })
    const selectedSector = facility.sectors[0]

    for (let i = 0; i < 3; i++) {
      await createParcel(app, {
        originSectorId: selectedSector.id,
        destinationSectorId: selectedSector.id,
        currentFacilityId: facility.id,
        status: ShipmentStatus.ArrivedAtDestinationHub,
        weightGrams: 3000
      })
    }

    const { token } = await createUser(app, UserRole.Manager, {
      assignedFacilityId: facility.id
    })

    const response = await app.inject({
      method: 'GET',
      url: deliveries.index,
      headers: {
        authorization: `Bearer ${token}`
      }
    })

    expect(response.statusCode).toBe(200);

    const body = response.json();
    expect(body.message).toBe('Deliveries retrieved.');

    const data = body.data;

    expect(data.facility).toBeDefined();
    expect(data.facility.id).toBe(facility.id);
    expect(data.facility.name).toBe(facility.name);
    expect(data.facility.code).toBe(facility.code);

    expect(Array.isArray(data.availableVehicles)).toBe(true);
    expect(data.availableVehicles.length).toBeGreaterThan(0);

    expect(Array.isArray(data.queue)).toBe(true);
    expect(Array.isArray(data.pendingParcels)).toBe(true);
    expect(data.pendingParcels.length).toBe(3);
  })

  test('a manager can setup the Distribution Phase last-mile', async () => {
    await seedMasterInfrustructure(app)

    const { id: facilityId, sectors, vehicles, users: couriers } = await app.prisma.facility.findFirstOrThrow({
      where: { code: "BR-MAR-01" },
      include: {
        sectors: true,
        vehicles: true,
        users: {
          where: { role: UserRole.Courier },
          include: { courier: true }
        },
      },
    })
    const selectedSector = sectors[0]
    const selectedVehicle = vehicles[0]
    const selectedCourier = couriers[0].courier as Courier

    const { token } = await createUser(app, UserRole.Manager, {
      assignedFacilityId: facilityId
    })

    for (let i = 0; i < 3; i++) {
      await createParcel(app, {
        originSectorId: selectedSector.id,
        destinationSectorId: selectedSector.id,
        currentFacilityId: facilityId,
        status: ShipmentStatus.ArrivedAtDestinationHub,
        weightGrams: 300000
      })
    }

    const parcels = await app.prisma.parcel.findMany()
    const parcelIds = parcels.map((p) => p.id)

    await createUser(app, UserRole.Manager, {
      assignedFacilityId: facilityId
    })

    const payload = {
      sectorId: selectedSector.id,
      courierId: selectedCourier.id,
      vehicleId: selectedVehicle.id,
      currentWeightGrams: 21000,
      currentVolumeCbm: 0.15,
      parcelIds,
      scheduledTime: "2026-10-21T08:00:00.000Z",
    }

    const response = await app.inject({
      method: 'POST',
      url: deliveries.store,
      headers: {
        authorization: `Bearer ${token}`
      },
      body: payload
    })

    const body = response.json()
    const data = body.data ?? body

    expect(response.statusCode).toBe(201);
    expect(body.message).toBe('Delivery created successfully.');

    expect(data.deliveryId).toBeDefined();
    expect(data.code).toMatch(/^DEL-\d{8}-\d{3}$/); // e.g. DEL-20261020-001
    expect(data.totalParcels).toBe(3);
    expect(data.currentWeightGrams).toBe(21000);
    expect(data.currentVolumeCbm).toBe(0.15);

    expect(data.courierScheduleId).toBeDefined();
    expect(data.fleetTransport).toBeDefined();
    expect(data.fleetTransport.vehicleId).toBe(selectedVehicle.id);
    expect(data.fleetTransport.scheduledFor).toBe('Delivery');
    expect(data.fleetTransport.scheduledTime).toBeDefined();
    expect(data.fleetTransport.courierId).toBe(selectedCourier.id);
  })

  test('a scheduled delivery is automatically dispatched by getting out of the 100meter geo spatial radius', async () => {
    await seedMasterInfrustructure(app)

    const result = await createDelivery(app, {
      parcelOverrides: { status: ShipmentStatus.ArrivedAtDestinationHub }
    })

    const response = await app.inject({
      method: 'PATCH',
      url: deliveries.dispatch(result.delivery.code)
    })

    const body = response.json();
    const data = body.data ?? body;

    expect(response.statusCode).toBe(200);
    expect(body.message).toBe('Delivery dispatched.');
    expect(data.status).toBe(DeliveryStatus.Loading);

    const fleetTransport = await app.prisma.fleetTransport.findUniqueOrThrow({
      where: { id: data.courierScheduleId }
    })
    if (!fleetTransport.courierId) {
      throw new Error("Cannot dispatch delivery: No courier assigned to this schedule.");
    }
    const assignedCourierId = fleetTransport.courierId;

    const sector = await app.prisma.sector.findUniqueOrThrow({
      where: { id: result.delivery.sectorId }
    })

    const courierLog = await app.prisma.courierLog.findFirstOrThrow({
      where: { courierId: assignedCourierId }
    })
    expect(courierLog).toBeDefined();

    const parcelIds = data.parcels.map((p: any) => p.id)
    const trackingLogs = await app.prisma.trackingLog.findMany({
      where: { parcelId: { in: parcelIds }, status: 'OutForDelivery' },
      orderBy: { id: 'asc' }
    });

    expect(trackingLogs).toHaveLength(parcelIds.length);
    trackingLogs.forEach((log) => {
      expect(log).toMatchObject({
        status: 'OutForDelivery',
        facilityId: sector.localBranchId,
        courierId: assignedCourierId,
      });

      expect(log.description).toContain('out for delivery');
      expect(log.description).toContain('Courier');
      expect(log.createdAt).toBeInstanceOf(Date);
    });
  })

  test('an assigned courier can hand out and scan the parcel to confirm the receiving of the item in the delivery process', async () => {
    await seedMasterInfrustructure(app)

    const result = await createDelivery(app)

    const parcelList = await app.prisma.parcel.findMany({
      where: { id: { in: result.parcelIds } }
    })
    const deliveredParcel = parcelList[0]

    const response = await app.inject({
      method: 'PATCH',
      url: parcels.delivered(deliveredParcel.trackingNumber),
    })

    const body = response.json()
    const data = body.data ?? body

    expect(response.statusCode).toBe(200);
    expect(body.message).toBe('Parcel is delivered successfully.');
    expect(data.status).toBe(ShipmentStatus.Delivered);

    const trackingLog = await app.prisma.trackingLog.findFirst({
      where: {
        parcelId: deliveredParcel.id,
        status: ShipmentStatus.Delivered
      },
      orderBy: { createdAt: 'desc' }
    });
    expect(trackingLog).toBeDefined();
    expect(trackingLog?.parcelId).toBe(deliveredParcel.id);
    expect(trackingLog?.status).toBe(ShipmentStatus.Delivered);
    expect(trackingLog?.description).toBeDefined();

    if (!deliveredParcel.deliveryId) {
      return
    }
    const deliveryId = deliveredParcel.deliveryId
    const delivery = await app.prisma.delivery.findUniqueOrThrow({
      where: { id: deliveryId },
      include: {
        parcels: {
          where: { status: ShipmentStatus.ReadyForPickup }
        }
      }
    })
    const parcelsRemaining = delivery.parcels.length
    expect(parcelsRemaining).toBe(2) // 3 ReadyForPickup Parcels are created in the delivery factory
  })

  test('distribution process can be completed', async () => {
    await seedMasterInfrustructure(app)

    const result = await createDelivery(app, { parcelOverrides: { status: ShipmentStatus.Delivered } })

    const response = await app.inject({
      method: 'PATCH',
      url: deliveries.completed(result.delivery.code)
    })

    const body = response.json();
    const data = body.data as Delivery ?? body;

    expect(response.statusCode).toBe(200);
    expect(body.message).toBe('Delivery completed.');
    expect(data.status).toBe(DeliveryStatus.Completed);

    const deliveryLog = await app.prisma.deliveryLog.findFirstOrThrow({
      where: { deliveryId: data.id },
      orderBy: { createdAt: 'desc' }
    })
    expect(deliveryLog).toBeDefined();
    expect(deliveryLog?.status).toBe(DeliveryStatus.Completed);
  })

  // TODO: GeoFencing
  test('distribution can be set to arrived', async () => {
    await seedMasterInfrustructure(app)

    const result = await createDelivery(app, {
      parcelOverrides: { status: ShipmentStatus.Delivered },
      deliveryOverrides: { status: DeliveryStatus.Completed }
    })

    const response = await app.inject({
      method: 'PATCH',
      url: deliveries.arrived(result.delivery.code)
    })

    const body = response.json();
    const data = body.data as Delivery ?? body;

    expect(response.statusCode).toBe(200);
    expect(body.message).toBe('Distributor has arrived.');
    expect(data.status).toBe(DeliveryStatus.Arrived);

    const fleetTransport = await app.prisma.fleetTransport.findUniqueOrThrow({
      where: { id: data.courierScheduleId }
    })
    if (!fleetTransport.courierId) {
      throw new Error("Cannot dispatch delivery: No courier assigned to this schedule.");
    }
    const assignedCourierId = fleetTransport.courierId;

    const courierLog = await app.prisma.courierLog.findFirstOrThrow({
      where: { courierId: assignedCourierId },
      orderBy: { createdAt: 'desc' }
    })
    expect(courierLog).toBeDefined();
    expect(courierLog?.status).toBe(CourierStatus.Available);

    const deliveryLog = await app.prisma.deliveryLog.findFirstOrThrow({
      where: { deliveryId: data.id },
      orderBy: { createdAt: 'desc' }
    })
    expect(deliveryLog).toBeDefined();
    expect(deliveryLog?.status).toBe(DeliveryStatus.Arrived);
  })
})