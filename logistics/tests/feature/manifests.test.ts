import { API_ROUTES } from "#commons/constants/routes.js";
import { FastifyInstance } from "fastify";
import { beforeAll, describe, expect, it, test } from "vitest";
import { FacilityType, ShipmentStatus, UserRole } from "@prisma/client";
import { seedFacilities } from "../../prisma/seeders/facilities.seed.js";
import { createParcel } from "../factory/parcel.factory.js";
import { createuser } from "../factory/user.factory.js";
import { seedVehicleProfiles } from "../../prisma/seeders/vehicle-profiles.seed.js";
import { seedMasterInfrustructure } from "../../prisma/seeders/tests/master-infrastructure-tests.seed.js";

describe('Manifest Domain', async () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = (globalThis as any).app as FastifyInstance
  })

  it('has a manifest dashboard UI', async () => {
    await seedMasterInfrustructure(app)

    const { id: facilityId, sectors } = await app.prisma.facility.findFirstOrThrow({
      where: { code: "BR-MAR-0001" },
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
      url: API_ROUTES.manifest.index,
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

    const { id: facilityId, sectors, vehicles } = await app.prisma.facility.findFirstOrThrow({
      where: { code: "BR-MAR-0001" },
      include: {
        sectors: true,
        vehicles: true
      },
    })
    const selectedSector = sectors[0]
    const selectedVehicle = vehicles[0]
    console.log({ selectedSector, selectedVehicle })

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
    console.log({parcels, parcelIds})

    await createuser(app, UserRole.Manager, {
      assignedFacilityId: facilityId
    })

    const payload = {
      sectorId: selectedSector.id,
      vehicleId: selectedVehicle.id,
      currentWeightGrams: 21000,
      currentVolumeCbm: 0.15,
      parcelIds,
    }

    const response = await app.inject({
      method: 'POST',
      url: API_ROUTES.manifest.store,
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
    expect(data.courierSchedule.courierId).toBeNull();
  })
})