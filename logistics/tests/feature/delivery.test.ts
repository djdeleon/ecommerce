import { FastifyInstance } from "fastify";
import { beforeAll, describe, expect, test } from "vitest";
import { seedMasterInfrustructure } from "../../prisma/seeders/tests/master-infrastructure-tests.seed.js";
import { createParcel } from "../factory/parcel.factory.js";
import { Courier, CourierStatus, Delivery, DeliveryStatus, ShipmentStatus, UserRole } from "@prisma/client";
import { createuser } from "../factory/user.factory.js";
import { API_ROUTES } from "#commons/constants/routes.js";
import { createDelivery } from "../factory/delivery.factory.js";

describe('Distribution Phase (Delivery - Last Mile)', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = (globalThis as any).app as FastifyInstance
  })

  test('a delivery has its own dashboard UI', async () => {
    await seedMasterInfrustructure(app)

    const { id: facilityId, sectors } = await app.prisma.facility.findFirstOrThrow({
      where: { code: "BR-MAR-01" },
      include: {
        sectors: true
      }
    })
    const selectedSector = sectors[0]
    console.log(selectedSector)

    for (let i = 0; i < 3; i++) {
      await createParcel(app, {
        originSectorId: selectedSector.id,
        destinationSectorId: selectedSector.id,
        currentFacilityId: facilityId,
        status: ShipmentStatus.ArrivedAtDestinationHub,
        weightGrams: 3000
      })
    }

    const { token } = await createuser(app, UserRole.Manager, {
      assignedFacilityId: facilityId
    })

    const response = await app.inject({
      method: 'GET',
      url: API_ROUTES.deliveries.index,
      headers: {
        authorization: `Bearer ${token}`
      }
    })

    const data = response.json().data[0]

    expect(response.statusCode).toBe(200);

    expect(data.originSectorId).toBe(selectedSector.id);
    expect(data.totalCount).toBe(3);
    expect(data.totalWeightGrams).toBe(9000);
    expect(data.totalCbm).toBeCloseTo(0.009, 4);
    expect(Number(data.totalDeclaredValue)).toBe(1500);

    expect(data.selectedVehicle).toBeDefined();
    expect(data.selectedVehicle.assignedFacilityId).toBe(facilityId);
    expect(data.selectedVehicle.vehicleProfile.modelName).toBe('Wave RSX Drum');
    expect(data.selectedVehicle.vehicleProfile.maxWeightCapacityG).toBeGreaterThanOrEqual(data.totalWeightGrams);
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

    await createuser(app, UserRole.Manager, {
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
      url: API_ROUTES.deliveries.store,
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
    expect(data.courierSchedule).toBeDefined();
    expect(data.courierSchedule.vehicleId).toBe(selectedVehicle.id);
    expect(data.courierSchedule.scheduledFor).toBe('Delivery');
    expect(data.courierSchedule.scheduledTime).toBeDefined();
    expect(data.courierSchedule.courierId).toBe(selectedCourier.id);
  })

  test('a scheduled delivery is automatically dispatched by getting out of the 100meter geo spatial radius', async () => {
    await seedMasterInfrustructure(app)

    const result = await createDelivery(app, {
      parcelOverrides: { status: ShipmentStatus.ArrivedAtDestinationHub }
    })

    const response = await app.inject({
      method: 'PATCH',
      url: API_ROUTES.deliveries.dispatch(result.delivery.code)
    })

    const body = response.json();
    const data = body.data ?? body;

    expect(response.statusCode).toBe(200);
    expect(body.message).toBe('Delivery dispatched.');
    expect(data.status).toBe(DeliveryStatus.Loading);

    const courierSchedule = await app.prisma.courierSchedule.findUniqueOrThrow({
      where: { id: data.courierScheduleId }
    })
    if (!courierSchedule.courierId) {
      throw new Error("Cannot dispatch delivery: No courier assigned to this schedule.");
    }
    const assignedCourierId = courierSchedule.courierId;

    const dispatchLog = await app.prisma.dispatchLog.findFirst({
      where: { assignedCourierId }
    });
    expect(dispatchLog).toBeDefined();

    const sector = await app.prisma.sector.findUniqueOrThrow({
      where: { id: result.delivery.sectorId }
    })
    expect(dispatchLog?.originFacilityId).toBe(sector.localBranchId);

    const courierLog = await app.prisma.courierLog.findFirstOrThrow({
      where: { courierId: assignedCourierId }
    })
    expect(courierLog).toBeDefined();

    const parcelIds = data.parcels.map((p) => p.id)
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

    const parcels = await app.prisma.parcel.findMany({
      where: { id: { in: result.parcelIds } }
    })
    const deliveredParcel = parcels[0]

    const response = await app.inject({
      method: 'PATCH',
      url: API_ROUTES.parcels.delivered(deliveredParcel.trackingNumber),
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
      url: API_ROUTES.deliveries.completed(result.delivery.code)
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
      url: API_ROUTES.deliveries.arrived(result.delivery.code)
    })

    const body = response.json();
    const data = body.data as Delivery ?? body;

    expect(response.statusCode).toBe(200);
    expect(body.message).toBe('Distributor has arrived.');
    expect(data.status).toBe(DeliveryStatus.Arrived);

    const courierSchedule = await app.prisma.courierSchedule.findUniqueOrThrow({
      where: { id: data.courierScheduleId }
    })
    if (!courierSchedule.courierId) {
      throw new Error("Cannot dispatch delivery: No courier assigned to this schedule.");
    }
    const assignedCourierId = courierSchedule.courierId;

    const dispatchLog = await app.prisma.dispatchLog.findFirst({
      where: { assignedCourierId },
      orderBy: { createdAt: 'desc' }
    });
    expect(dispatchLog).toBeDefined();
    expect(dispatchLog?.arrivedAt).toBeDefined();

    const sector = await app.prisma.sector.findUniqueOrThrow({
      where: { id: result.delivery.sectorId }
    })
    expect(dispatchLog?.originFacilityId).toBe(sector.localBranchId);

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