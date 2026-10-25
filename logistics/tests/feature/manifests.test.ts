import { API_ROUTES } from "#commons/constants/routes.js";
import { FastifyInstance } from "fastify";
import { beforeAll, describe, expect, test } from "vitest";
import { Courier, CourierStatus, Manifest, ManifestStatus, ShipmentStatus, UserRole } from "@prisma/client";
import { createParcel } from "../factory/parcel.factory.js";
import { createuser } from "../factory/user.factory.js";
import { seedMasterInfrustructure } from "../../prisma/seeders/tests/master-infrastructure-tests.seed.js";
import { createManifest } from "../factory/manifest.factory.js";

describe('Manifest Domain', async () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = (globalThis as any).app as FastifyInstance
  })

  test('a manifest has its own dashboard UI', async () => {
    await seedMasterInfrustructure(app)

    const { id: facilityId, sectors } = await app.prisma.facility.findFirstOrThrow({
      where: { code: "DC-PAR-01" },
      include: {
        sectors: true
      }
    })
    const selectedSector = sectors[0]

    for (let i = 0; i < 3; i++) {
      await createParcel(app, {
        originSectorId: selectedSector.id,
        destinationSectorId: selectedSector.id,
        currentFacilityId: facilityId,
        status: ShipmentStatus.ReadyForPickup,
        weightGrams: 300000
      })
    }

    const { token } = await createuser(app, UserRole.Manager, {
      assignedFacilityId: facilityId
    })

    const response = await app.inject({
      method: 'GET',
      url: API_ROUTES.manifests.index,
      headers: {
        authorization: `Bearer ${token}`
      }
    })

    const body = response.json()
    const data = body.data ?? body

    expect(response.statusCode).toBe(200);

    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(1);

    const sectorManifest = data[0];
    expect(sectorManifest.originSectorId).toBe(selectedSector.id);
    expect(sectorManifest.totalCount).toBe(3);
    expect(sectorManifest.totalWeightGrams).toBe(900000);
    expect(sectorManifest.totalCbm).toBeCloseTo(0.009, 4);
    expect(Number(sectorManifest.totalDeclaredValue)).toBe(1500);

    expect(sectorManifest.selectedVehicle).toBeDefined();
    expect(sectorManifest.selectedVehicle.assignedFacilityId).toBe(facilityId);
    expect(sectorManifest.selectedVehicle.vehicleProfile.modelName).toBe('L300');
    expect(sectorManifest.selectedVehicle.vehicleProfile.maxWeightCapacityG).toBeGreaterThanOrEqual(sectorManifest.totalWeightGrams);
  })

  test('a manager can setup the Accumulation Phase first-mile', async () => {
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
        status: ShipmentStatus.ReadyForPickup,
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
      url: API_ROUTES.manifests.store,
      body: payload
    })

    const body = response.json()
    const data = body.data ?? body

    expect(response.statusCode).toBe(201);
    expect(body.message).toBe('Manifest created successfully.');

    expect(data.manifestId).toBeDefined();
    expect(data.code).toMatch(/^MNF-\d{8}-\d{3}$/); // e.g. MNF-20261020-001
    expect(data.totalParcels).toBe(3);
    expect(data.currentWeightGrams).toBe(21000);
    expect(data.currentVolumeCbm).toBe(0.15);

    expect(data.courierScheduleId).toBeDefined();
    expect(data.courierSchedule).toBeDefined();
    expect(data.courierSchedule.vehicleId).toBe(selectedVehicle.id);
    expect(data.courierSchedule.scheduledFor).toBe('Accumulation');
    expect(data.courierSchedule.scheduledTime).toBeDefined();
    expect(data.courierSchedule.courierId).toBe(selectedCourier.id);
  })

  // TODO: GeoFencing
  test('a scheduled manifest is automatically dispatched by scanning the Manifest Code', async () => {
    await seedMasterInfrustructure(app)

    const result = await createManifest(app)

    const response = await app.inject({
      method: 'PATCH',
      url: API_ROUTES.manifests.dispatch(result.manifest.code)
    })

    const body = response.json();
    const data = body.data as Manifest ?? body;

    expect(response.statusCode).toBe(200);
    expect(body.message).toBe('Manifest dispatched.');
    expect(data.status).toBe(ManifestStatus.Accumulating);

    const courierSchedule = await app.prisma.courierSchedule.findUniqueOrThrow({
      where: { id: data.courierScheduleId }
    })
    if (!courierSchedule.courierId) {
      throw new Error("Cannot dispatch manifest: No courier assigned to this schedule.");
    }
    const assignedCourierId = courierSchedule.courierId;

    const dispatchLog = await app.prisma.dispatchLog.findFirst({
      where: { assignedCourierId }
    });
    expect(dispatchLog).toBeDefined();

    const sector = await app.prisma.sector.findUniqueOrThrow({
      where: { id: result.manifest.sectorId }
    })
    expect(dispatchLog?.originFacilityId).toBe(sector.localBranchId);

    const courierLog = await app.prisma.courierLog.findFirstOrThrow({
      where: { courierId: assignedCourierId }
    })
    expect(courierLog).toBeDefined();
  })

  test('an assigned courier can pick up and scan the parcel tracking number in the accumulation process', async () => {
    await seedMasterInfrustructure(app)

    const result = await createManifest(app)

    const parcels = await app.prisma.parcel.findMany({
      where: { id: { in: result.parcelIds } }
    })
    const manifestedParcel = parcels[0]

    const response = await app.inject({
      method: 'PATCH',
      url: API_ROUTES.parcels.pickedUp(manifestedParcel.trackingNumber),
    })

    const body = response.json()
    const data = body.data ?? body

    expect(response.statusCode).toBe(200);
    expect(body.message).toBe('Parcel is picked up successfully.');
    expect(data.status).toBe(ShipmentStatus.PickedUp);

    const trackingLog = await app.prisma.trackingLog.findFirst({
      where: {
        parcelId: manifestedParcel.id,
        status: ShipmentStatus.PickedUp
      },
      orderBy: { createdAt: 'desc' }
    });
    expect(trackingLog).toBeDefined();
    expect(trackingLog?.parcelId).toBe(manifestedParcel.id);
    expect(trackingLog?.status).toBe(ShipmentStatus.PickedUp);
    expect(trackingLog?.description).toBeDefined();

    if (!manifestedParcel.manifestId) {
      return
    }
    const manifestId = manifestedParcel.manifestId
    const manifest = await app.prisma.manifest.findUniqueOrThrow({
      where: { id: manifestId },
      include: {
        parcels: {
          where: { status: ShipmentStatus.ReadyForPickup }
        }
      }
    })
    const parcelsRemaining = manifest.parcels.length
    expect(parcelsRemaining).toBe(2) // 3 ReadyForPickup Parcels are created in the manifest factory
  })

  test('accumulation process can be completed', async () => {
    await seedMasterInfrustructure(app)

    const result = await createManifest(app, { parcelOverrides: { status: ShipmentStatus.PickedUp } })

    const response = await app.inject({
      method: 'PATCH',
      url: API_ROUTES.manifests.complete(result.manifest.code)
    })

    const body = response.json();
    const data = body.data as Manifest ?? body;

    expect(response.statusCode).toBe(200);
    expect(body.message).toBe('Manifest completed.');
    expect(data.status).toBe(ManifestStatus.Completed);

    const courierSchedule = await app.prisma.courierSchedule.findUniqueOrThrow({
      where: { id: data.courierScheduleId }
    })
    if (!courierSchedule.courierId) {
      throw new Error("Cannot dispatch manifest: No courier assigned to this schedule.");
    }

    const manifestLog = await app.prisma.manifestLog.findFirstOrThrow({
      where: { manifestId: data.id },
      orderBy: { createdAt: 'desc' }
    })
    expect(manifestLog).toBeDefined();
    expect(manifestLog?.status).toBe(ManifestStatus.Completed);
  })

  // TODO: GeoFencing
  test('manifested parcels can be set to arrived', async () => {
    await seedMasterInfrustructure(app)

    const result = await createManifest(app, {
      parcelOverrides: { status: ShipmentStatus.PickedUp },
      manifestOverrides: { status: ManifestStatus.Completed }
    })

    const response = await app.inject({
      method: 'PATCH',
      url: API_ROUTES.manifests.arrive(result.manifest.code)
    })

    const body = response.json();
    const data = body.data as Manifest ?? body;

    expect(response.statusCode).toBe(200);
    expect(body.message).toBe('Manifested Parcels arrived.');
    expect(data.status).toBe(ManifestStatus.Arrived);

    const courierSchedule = await app.prisma.courierSchedule.findUniqueOrThrow({
      where: { id: data.courierScheduleId }
    })
    if (!courierSchedule.courierId) {
      throw new Error("Cannot dispatch manifest: No courier assigned to this schedule.");
    }
    const assignedCourierId = courierSchedule.courierId;

    const dispatchLog = await app.prisma.dispatchLog.findFirst({
      where: { assignedCourierId },
      orderBy: { createdAt: 'desc' }
    });
    expect(dispatchLog).toBeDefined();
    expect(dispatchLog?.arrivedAt).toBeDefined();

    const sector = await app.prisma.sector.findUniqueOrThrow({
      where: { id: result.manifest.sectorId }
    })
    expect(dispatchLog?.originFacilityId).toBe(sector.localBranchId);

    const courierLog = await app.prisma.courierLog.findFirstOrThrow({
      where: { courierId: assignedCourierId },
      orderBy: { createdAt: 'desc' }
    })
    expect(courierLog).toBeDefined();
    expect(courierLog?.status).toBe(CourierStatus.Available);

    const manifestLog = await app.prisma.manifestLog.findFirstOrThrow({
      where: { manifestId: data.id },
      orderBy: { createdAt: 'desc' }
    })
    expect(manifestLog).toBeDefined();
    expect(manifestLog?.status).toBe(ManifestStatus.Arrived);

    const updatedParcels = await app.prisma.parcel.updateManyAndReturn({
      where: { manifestId: data.id },
      data: { status: ShipmentStatus.ArrivedAtOriginHub }
    })
    const parcelIds = updatedParcels.map((p) => p.id)

    const trackingLogs = await app.prisma.trackingLog.findMany({
      where: { parcelId: { in: parcelIds } }
    })
    trackingLogs.forEach((log) => {
      expect(log.status).toBe(ShipmentStatus.ArrivedAtOriginHub)
    })
  })
})