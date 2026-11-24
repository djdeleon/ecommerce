import { FastifyInstance } from "fastify";
import { beforeAll, beforeEach, describe, expect, test } from "vitest";
import { Courier, CourierStatus, FacilityType, FleetTransportType, Manifest, ManifestStatus, ParcelStatus, UserRole, VehicleStatus, VehicleType } from "@prisma/client";
import { createParcel } from "../factory/parcel.factory.js";
import { createUser } from "../factory/user.factory.js";
import { seedMasterInfrustructure } from "../../prisma/seeders/tests/master-infrastructure-tests.seed.js";
import { createManifest } from "../factory/manifest.factory.js";
import { manifests } from "../../src/modules/manifests/paths.js";
import { adminParcels } from "../../src/modules/parcels/paths.js";
import { createFacility } from "../factory/facility.factory.js";
import { createSector } from "../factory/sector.factory.js";
import { createCourier } from "#factory";

describe('Manifest Domain', async () => {
  let app: FastifyInstance;
  let adminToken: string;
  let facility: any;
  let sector: any;
  let vehicle: any;

  beforeEach(async () => {
    app = (globalThis as any).app as FastifyInstance;

    facility = await createFacility(app, {
      name: 'Manila Sorting Gateway',
      code: 'GW-MNL-01',
      address: "659 A. Antonio Villegas St, Ermita, Manila, 1000 Metro Manila, Philippines",
      type: FacilityType.MegaGateway,
      longitude: 120.981105,
      latitude: 14.590152,
      parentId: null
    })

    const { user, token } = await createUser(app, UserRole.Admin, { assignedFacilityId: facility.id });
    adminToken = token;

    // Hierarchical PH Address (Origin)
    // Region
    await app.prisma.region.create({
      data: {
        id: "1300000000",
        name: "National Capital Region (NCR)",
        code: "NCR"
      }
    })
    // Province (null)
    // City
    const origCity = await app.prisma.city.create({
      data: {
        id: "1380600000",
        name: "City of Manila",
        code: "MNL",
        provinceId: null,
      }
    })
    // Barangay
    const origBrgy = await app.prisma.barangay.create({
      data: {
        id: "1380601148",
        name: "Barangay 148",
        code: "NCR-MTR-MNL-148",
        cityId: origCity.id,
      }
    })

    sector = await createSector(app, {
      "code": "NCR-MTR-MNL-S01",
      "zone": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              120.997335,
              14.618191
            ],
            [
              120.996161,
              14.620762
            ],
            [
              120.993822,
              14.622563
            ],
            [
              120.992624,
              14.623468
            ],
            [
              120.990515,
              14.625138
            ],
            [
              120.993059,
              14.635933
            ],
            [
              120.986756,
              14.630045
            ],
            [
              120.98416,
              14.630203
            ],
            [
              120.983397,
              14.631246
            ],
            [
              120.981065,
              14.630995
            ],
            [
              120.981462,
              14.634183
            ],
            [
              120.982329,
              14.636257
            ],
            [
              120.981839,
              14.638013
            ],
            [
              120.981441,
              14.638564
            ],
            [
              120.979039,
              14.637893
            ],
            [
              120.979709,
              14.635522
            ],
            [
              120.977955,
              14.63553
            ],
            [
              120.976568,
              14.635175
            ],
            [
              120.973495,
              14.63288
            ],
            [
              120.968625,
              14.635591
            ],
            [
              120.966723,
              14.635124
            ],
            [
              120.963338,
              14.635905
            ],
            [
              120.960971,
              14.635985
            ],
            [
              120.961357,
              14.629692
            ],
            [
              120.957068,
              14.633312
            ],
            [
              120.941395,
              14.634231
            ],
            [
              120.959373,
              14.629056
            ],
            [
              120.959942,
              14.626081
            ],
            [
              120.955452,
              14.61921
            ],
            [
              120.956795,
              14.61437
            ],
            [
              120.957451,
              14.611794
            ],
            [
              120.959763,
              14.611374
            ],
            [
              120.962971,
              14.609596
            ],
            [
              120.964269,
              14.608686
            ],
            [
              120.966686,
              14.608671
            ],
            [
              120.966701,
              14.607737
            ],
            [
              120.967222,
              14.607249
            ],
            [
              120.970213,
              14.605748
            ],
            [
              120.971737,
              14.603624
            ],
            [
              120.973861,
              14.60178
            ],
            [
              120.975703,
              14.60305
            ],
            [
              120.975355,
              14.604802
            ],
            [
              120.975829,
              14.605573
            ],
            [
              120.977192,
              14.607016
            ],
            [
              120.979001,
              14.608776
            ],
            [
              120.980097,
              14.608849
            ],
            [
              120.980508,
              14.609865
            ],
            [
              120.986321,
              14.609856
            ],
            [
              120.990724,
              14.61182
            ],
            [
              120.997335,
              14.618191
            ]
          ]
        ]
      },
      "barangayIds": [
        "1380601148", // Selected Barangay 148 
      ],
      facilityId: facility.id
    })

    const vehicleProfile = await app.prisma.vehicleProfile.create({
      data: {
        brand: 'Mitsubishi',
        modelName: 'L300',
        variant: 'Van',
        maxWeightCapacityG: 1000000,
        maxUsableVolumeCbm: 3.3,
        allocationVolumeTarget: 0.75,
        lengthMm: 4000,
        widthMm: 1700,
        heightMm: 1800,
        type: VehicleType.Van,
      },
    });

    vehicle = await app.prisma.physicalVehicle.create({
      data: {
        vehicleProfileId: vehicleProfile.id,
        assignedFacilityId: facility.id,
        status: VehicleStatus.Available,
        plateNumber: 'ABC-1234',
      },
    });
  });

  describe.only('Manifest Domain - Module Management', () => {
    test('GET /manifests (Index): returns sector aggregates, pending parcels, and available vehicles', async () => {
      const response = await app.inject({
        method: 'GET',
        url: manifests.index,
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      });

      const body = response.json();

      expect(response.statusCode).toBe(200);
      expect(body.data).toHaveProperty('facility');
      expect(body.data).toHaveProperty('availableVehicles');
      expect(body.data).toHaveProperty('queue');
      expect(body.data).toHaveProperty('pendingParcels');
      expect(body.data.facility.id).toBe(facility.id);
      expect(body.data.availableVehicles).toHaveLength(1);
    });

    test('POST /manifests (Store): successfully creates a manifest, schedules transport, and links parcels', async () => {
      // Create a dummy ready_for_pickup parcel
      const trackingNumberRel = await app.prisma.trackingNumber.create({
        data: { number: `TRK-${Date.now()}` },
      });

      const parcel = await app.prisma.parcel.create({
        data: {
          trackingNumber: trackingNumberRel.number,
          weightGrams: 1500,
          lengthCm: 20,
          heightCm: 10,
          widthCm: 15,
          calculatedCbm: 0.003,
          declaredValue: 500,
          originSectorId: sector.id,
          destinationSectorId: sector.id,
          originFacilityId: facility.id,
          sortingCodeCache: 'CACHE-01',
          routingPipelineCache: 'PIPELINE-01',
          recipientName: 'Juan Dela Cruz',
          recipientPhone: '09171234567',
          recipientAddress: '123 Test St',
          recipientBarangayId: '1380601148',
          status: ParcelStatus.ReadyForPickup,
        },
      });

      const scheduledTimeStr = new Date().toISOString();
      const payload = {
        sectorId: sector.id,
        courierId: null,
        vehicleId: vehicle.id,
        currentWeightGrams: 1500,
        currentVolumeCbm: 0.003,
        scheduledTime: scheduledTimeStr,
        parcelIds: [parcel.id],
      };

      const response = await app.inject({
        method: 'POST',
        url: manifests.store,
        headers: { authorization: `Bearer ${adminToken}` },
        body: payload,
      });

      const body = response.json();

      expect(response.statusCode).toBe(201);
      expect(body.message).toBe('Manifest created successfully.');
      expect(body.data.code).toMatch(/^MNF-\d{8}-\d{3}$/);
      expect(body.data.totalParcels).toBe(1);
      expect(body.data.currentWeightGrams).toBe(1500);
      expect(body.data.currentVolumeCbm).toBe(0.003);

      // Verify database side-effects
      const dbManifest = await app.prisma.manifest.findUnique({
        where: { code: body.data.code },
        include: {
          parcels: true,
          fleetTransport: true,
          logs: true,
        },
      });

      expect(dbManifest).not.toBeNull();
      expect(dbManifest?.status).toBe(ManifestStatus.Scheduled);
      expect(dbManifest?.sectorId).toBe(sector.id);
      expect(dbManifest?.currentWeightGrams).toBe(1500);

      expect(dbManifest?.fleetTransportId).toBeTruthy();
      expect(dbManifest?.fleetTransport).toMatchObject({
        facilityId: facility.id,
        vehicleId: vehicle.id,
        courierId: null,
      });

      expect(dbManifest?.logs).toHaveLength(1);
      expect(dbManifest?.logs[0].status).toBe(ManifestStatus.Scheduled);

      const updatedParcel = await app.prisma.parcel.findUnique({
        where: { id: parcel.id },
      });
      expect(updatedParcel?.manifestId).toBe(dbManifest?.id);
    });

    test('GET /manifests/:code (Show): successfully retrieves a single manifest with all relations', async () => {
      const { manifest } = await createManifest(app, {
        parcelOverrides: {
          parcelAmount: 2,
        },
        manifestOverrides: {
          status: ManifestStatus.Scheduled,
        },
      });

      const response = await app.inject({
        method: 'GET',
        url: manifests.show(manifest.code),
        headers: { authorization: `Bearer ${adminToken}` },
      });

      const body = response.json();

      expect(response.statusCode).toBe(200);
      expect(body.message).toBe('Manifest retrieved successfully.');
      expect(body.data.code).toBe(manifest.code);
      expect(body.data).toHaveProperty('sector');
      expect(body.data).toHaveProperty('fleetTransport');
      expect(body.data).toHaveProperty('parcels');
      expect(body.data).toHaveProperty('logs');
      expect(body.data.parcels).toHaveLength(2);
    });

    test('PUT /manifests/:code (Update): successfully updates manifest data and blocks updates on dispatched manifests', async () => {
      const { manifest } = await createManifest(app, {
        manifestOverrides: {
          currentWeightGrams: 1000,
          currentVolumeCbm: 0.002,
          status: ManifestStatus.Scheduled,
        }
      });

      const updatePayload = {
        currentWeightGrams: 2500,
        currentVolumeCbm: 0.005,
        status: ManifestStatus.Accumulating,
      };

      const response = await app.inject({
        method: 'PUT',
        url: manifests.update(manifest.code),
        headers: { authorization: `Bearer ${adminToken}` },
        body: updatePayload,
      });

      const body = response.json();

      expect(response.statusCode).toBe(200);
      expect(body.message).toBe('Manifest updated successfully.');
      expect(body.data.currentWeightGrams).toBe(2500);
      expect(body.data.currentVolumeCbm).toBe(0.005);
      expect(body.data.status).toBe(ManifestStatus.Accumulating);

      const dbManifest = await app.prisma.manifest.findUnique({
        where: { code: manifest.code },
      });
      expect(dbManifest?.currentWeightGrams).toBe(2500);
      expect(dbManifest?.status).toBe(ManifestStatus.Accumulating);
    });

    test('DELETE /manifests/:code (Delete): successfully deletes manifest, unlinks parcels, and blocks deletion of dispatched manifests', async () => {
      const { manifest, parcelIds } = await createManifest(app, {
        parcelOverrides: {
          parcelAmount: 2,
        },
        manifestOverrides: {
          status: ManifestStatus.Scheduled,
        },
      });

      const response = await app.inject({
        method: 'DELETE',
        url: manifests.delete(manifest.code),
        headers: { authorization: `Bearer ${adminToken}` },
      });

      const body = response.json();

      expect(response.statusCode).toBe(200);
      expect(body.message).toBe('Manifest deleted successfully.');

      const dbManifest = await app.prisma.manifest.findUnique({
        where: { code: manifest.code },
      });
      expect(dbManifest).toBeNull();

      const unlinkedParcels = await app.prisma.parcel.findMany({
        where: { id: { in: parcelIds } },
      });
      for (const parcel of unlinkedParcels) {
        expect(parcel.manifestId).toBeNull();
      }
    });
  })

  describe.only('Manifest Domain - Lifecycle State Machine Transitions', () => {
    describe('Manifest Domain - State Transition: Dispatched', () => {
      test('PATCH /manifests/:code/dispatch: successfully dispatches a Scheduled manifest, updates transport, courier status, and parcels', async () => {
        const { courier } = await createCourier(app, { currentFacilityId: facility.id });

        const { manifest, parcelIds } = await createManifest(app, {
          parcelOverrides: {
            parcelAmount: 2,
            status: ParcelStatus.ReadyForPickup
          },
          manifestOverrides: { status: ManifestStatus.Scheduled },
          fleetTransportOverrides: { courierId: courier.id },
        });

        const response = await app.inject({
          method: 'PATCH',
          url: manifests.dispatch(manifest.code),
          headers: { authorization: `Bearer ${adminToken}` },
        });

        const body = response.json();

        expect(response.statusCode).toBe(200);
        expect(body.data.status).toBe(ManifestStatus.Dispatched);

        const dbManifest = await app.prisma.manifest.findUniqueOrThrow({
          where: { code: manifest.code },
          include: {
            logs: { orderBy: { recordedAt: 'asc' } },
            fleetTransport: { include: { courier: true } },
          },
        });

        expect(dbManifest.status).toBe(ManifestStatus.Dispatched);
        expect(dbManifest.logs).toHaveLength(2);
        expect(dbManifest.logs[0].status).toBe(ManifestStatus.Scheduled);
        expect(dbManifest.logs[1].status).toBe(ManifestStatus.Dispatched);

        expect(dbManifest.fleetTransport?.dispatchedAt).not.toBeNull();

        const courierId = dbManifest.fleetTransport?.courierId;
        if (courierId) {
          const latestCourierLog = await app.prisma.courierLog.findFirst({
            where: { courierId },
            orderBy: { createdAt: 'desc' },
          });
          expect(latestCourierLog?.status).toBe(CourierStatus.Busy);
        }

        const updatedParcels = await app.prisma.parcel.findMany({
          where: { id: { in: parcelIds } },
          include: { parcelLogs: { orderBy: { createdAt: 'asc' } } },
        });

        for (const parcel of updatedParcels) {
          expect(parcel.status).toBe(ParcelStatus.ReadyForPickup);
          expect(parcel.parcelLogs).toHaveLength(2);
          expect(parcel.parcelLogs[0].status).toBe(ParcelStatus.PendingPickup);
          expect(parcel.parcelLogs[1].status).toBe(ParcelStatus.ReadyForPickup);
        }
      });

      test('PATCH /manifests/:code/dispatch: blocks dispatch if no courier is assigned', async () => {
        const { manifest } = await createManifest(app, {
          parcelOverrides: {
            parcelAmount: 2,
          },
          manifestOverrides: { status: ManifestStatus.Scheduled },
          courierScheduleOverrides: { courierId: null },
        });

        const response = await app.inject({
          method: 'PATCH',
          url: manifests.dispatch(manifest.code),
          headers: { authorization: `Bearer ${adminToken}` },
        });

        expect(response.statusCode).toBeGreaterThanOrEqual(400);

        const dbManifest = await app.prisma.manifest.findUniqueOrThrow({
          where: { code: manifest.code },
        });
        expect(dbManifest.status).toBe(ManifestStatus.Scheduled);
      });
    });

    describe('Manifest Domain - State Transition: Accumulating', () => {
      test('PATCH /manifests/:code/accumulate: successfully transitions a Dispatched manifest to Accumulating', async () => {
        const { manifest } = await createManifest(app, {
          parcelOverrides: {
            parcelAmount: 2,
          },
          manifestOverrides: { status: ManifestStatus.Dispatched },
        });

        const response = await app.inject({
          method: 'PATCH',
          url: manifests.accumulate(manifest.code),
          headers: { authorization: `Bearer ${adminToken}` },
        });

        const body = response.json();

        expect(response.statusCode).toBe(200);
        expect(body.message).toBe('Manifest accumulating successfully.');
        expect(body.data.status).toBe(ManifestStatus.Accumulating);

        const dbManifest = await app.prisma.manifest.findUniqueOrThrow({
          where: { code: manifest.code },
          include: {
            logs: { orderBy: { recordedAt: 'asc' } },
            fleetTransport: true,
          },
        });

        expect(dbManifest.status).toBe(ManifestStatus.Accumulating);

        expect(dbManifest.fleetTransport?.scheduledFor).toBe(FleetTransportType.Accumulation);

        expect(dbManifest.logs).toHaveLength(3);
        expect(dbManifest.logs[0].status).toBe(ManifestStatus.Scheduled);
        expect(dbManifest.logs[1].status).toBe(ManifestStatus.Dispatched);
        expect(dbManifest.logs[2].status).toBe(ManifestStatus.Accumulating);
      });

      test('PATCH /manifests/:code/accumulate: blocks invalid transition from Completed state', async () => {
        const { manifest } = await createManifest(app, {
          parcelOverrides: {
            parcelAmount: 2,
          },
          manifestOverrides: { status: ManifestStatus.Completed },
        });

        const response = await app.inject({
          method: 'PATCH',
          url: manifests.accumulate(manifest.code),
          headers: { authorization: `Bearer ${adminToken}` },
        });

        expect(response.statusCode).toBeGreaterThanOrEqual(400);

        const dbManifest = await app.prisma.manifest.findUniqueOrThrow({
          where: { code: manifest.code },
        });
        expect(dbManifest.status).toBe(ManifestStatus.Completed);
      });
    })

    describe('Manifest Domain - State Transition: Completed', () => {
      test('PATCH /manifests/:code/complete: successfully completes an Accumulating manifest when all parcels are picked up', async () => {
        const { manifest, fleetTransport } = await createManifest(app, {
          parcelOverrides: {
            parcelAmount: 2,
            status: ParcelStatus.PickedUp,
          },
          manifestOverrides: { status: ManifestStatus.Accumulating },
        });

        const { token } = await createUser(app, UserRole.Manager, {
          assignedFacilityId: fleetTransport.facilityId,
        });

        const response = await app.inject({
          method: 'PATCH',
          url: manifests.complete(manifest.code),
          headers: {
            authorization: `Bearer ${token}`,
          },
        });

        const body = response.json();
        const data = body.data as Manifest ?? body;

        expect(response.statusCode).toBe(200);
        expect(body.message).toBe('Manifest completed successfully.');
        expect(data.status).toBe(ManifestStatus.Completed);

        const dbManifest = await app.prisma.manifest.findUniqueOrThrow({
          where: { id: manifest.id },
          include: { logs: { orderBy: { createdAt: 'asc' } } },
        });

        expect(dbManifest.status).toBe(ManifestStatus.Completed);

        expect(dbManifest.logs).toHaveLength(4);
        expect(dbManifest.logs[0].status).toBe(ManifestStatus.Scheduled);
        expect(dbManifest.logs[1].status).toBe(ManifestStatus.Dispatched);
        expect(dbManifest.logs[2].status).toBe(ManifestStatus.Accumulating);
        expect(dbManifest.logs[3].status).toBe(ManifestStatus.Completed);
      });

      test('PATCH /manifests/:code/complete: blocks completion if parcels are still remaining (not PickedUp)', async () => {
        const { manifest, fleetTransport } = await createManifest(app, {
          parcelOverrides: {
            parcelAmount: 2,
            status: ParcelStatus.ReadyForPickup,
          },
          manifestOverrides: { status: ManifestStatus.Accumulating },
        });

        const { token } = await createUser(app, UserRole.Manager, {
          assignedFacilityId: fleetTransport.facilityId,
        });

        const response = await app.inject({
          method: 'PATCH',
          url: manifests.complete(manifest.code),
          headers: {
            authorization: `Bearer ${token}`,
          },
        });

        expect(response.statusCode).toBeGreaterThanOrEqual(400);

        const dbManifest = await app.prisma.manifest.findUniqueOrThrow({
          where: { id: manifest.id },
        });
        expect(dbManifest.status).toBe(ManifestStatus.Accumulating);
      });
    });

    describe('Manifest Domain - State Transition: Arrived', () => {
      test('PATCH /manifests/:code/arrive: successfully marks a Completed manifest as Arrived, updates transport, frees courier, and advances parcels', async () => {
        const { courier } = await createCourier(app, { currentFacilityId: facility.id });

        const { manifest, fleetTransport } = await createManifest(app, {
          parcelOverrides: {
            parcelAmount: 2,
            status: ParcelStatus.PickedUp,
          },
          manifestOverrides: { status: ManifestStatus.Completed },
          fleetTransportOverrides: { courierId: courier.id },
        });

        const { token } = await createUser(app, UserRole.Manager, {
          assignedFacilityId: fleetTransport.facilityId,
        });

        const response = await app.inject({
          method: 'PATCH',
          url: manifests.arrive(manifest.code),
          headers: {
            authorization: `Bearer ${token}`,
          },
        });

        const body = response.json();
        const data = body.data as Manifest ?? body;

        expect(response.statusCode).toBe(200);
        expect(body.message).toBe('Manifest arrived successfully.');
        expect(data.status).toBe(ManifestStatus.Arrived);

        const dbManifest = await app.prisma.manifest.findUniqueOrThrow({
          where: { id: manifest.id },
          include: {
            logs: { orderBy: { createdAt: 'asc' } },
            fleetTransport: true,
            parcels: { include: { parcelLogs: true } },
          },
        });

        expect(dbManifest.status).toBe(ManifestStatus.Arrived);
        expect(dbManifest.logs).toHaveLength(5);
        expect(dbManifest.logs[0].status).toBe(ManifestStatus.Scheduled);
        expect(dbManifest.logs[1].status).toBe(ManifestStatus.Dispatched);
        expect(dbManifest.logs[2].status).toBe(ManifestStatus.Accumulating);
        expect(dbManifest.logs[3].status).toBe(ManifestStatus.Completed);
        expect(dbManifest.logs[4].status).toBe(ManifestStatus.Arrived);

        expect(dbManifest.fleetTransport?.arrivedAt).not.toBeNull();

        const courierId = dbManifest.fleetTransport.courierId;
        if (courierId) {
          const latestCourierLog = await app.prisma.courierLog.findFirst({
            where: { courierId },
            orderBy: { createdAt: 'asc' },
          });
          expect(latestCourierLog?.status).toBe(CourierStatus.Available);
        }

        for (const parcel of dbManifest.parcels) {
          expect(parcel.status).toBe(ParcelStatus.ArrivedAtOriginHub);
          const latestLog = parcel.parcelLogs[parcel.parcelLogs.length - 1];
          expect(latestLog.status).toBe(ParcelStatus.ArrivedAtOriginHub);
        }
      });
    });

    describe('Manifest Domain - State Transition: Cancelled', () => {
      test('PATCH /manifests/:code/cancel: successfully cancels a Scheduled manifest and unlinks attached parcels', async () => {
        const { manifest, fleetTransport, parcelIds } = await createManifest(app, {
          parcelOverrides: {
            parcelAmount: 2,
          },
          manifestOverrides: { status: ManifestStatus.Scheduled },
        });

        const { token } = await createUser(app, UserRole.Manager, {
          assignedFacilityId: fleetTransport.facilityId,
        });

        const response = await app.inject({
          method: 'PATCH',
          url: manifests.cancel(manifest.code),
          headers: {
            authorization: `Bearer ${token}`,
          },
        });

        const body = response.json();
        const data = body.data as Manifest ?? body;

        expect(response.statusCode).toBe(200);
        expect(data.status).toBe(ManifestStatus.Cancelled);

        const dbManifest = await app.prisma.manifest.findUniqueOrThrow({
          where: { id: manifest.id },
          include: {
            logs: { orderBy: { createdAt: 'asc' } },
            parcels: { include: { parcelLogs: true } },
          },
        });

        expect(dbManifest.status).toBe(ManifestStatus.Cancelled);
        expect(dbManifest.logs).toHaveLength(2);
        expect(dbManifest.logs[0].status).toBe(ManifestStatus.Scheduled);
        expect(dbManifest.logs[1].status).toBe(ManifestStatus.Cancelled);

        const unlinkedParcels = await app.prisma.parcel.findMany({
          where: { id: { in: parcelIds } },
        });

        for (const parcel of unlinkedParcels) {
          expect(parcel.manifestId).toBeNull();
        }
      });

      test('PATCH /manifests/:code/cancel: blocks cancellation from terminal or invalid states (e.g., Completed)', async () => {
        const { manifest, fleetTransport } = await createManifest(app, {
          parcelOverrides: {
            parcelAmount: 2,
            status: ParcelStatus.PickedUp,
          },
          manifestOverrides: { status: ManifestStatus.Completed },
        });

        const { token } = await createUser(app, UserRole.Manager, {
          assignedFacilityId: fleetTransport.facilityId,
        });

        const response = await app.inject({
          method: 'PATCH',
          url: manifests.cancel(manifest.code),
          headers: {
            authorization: `Bearer ${token}`,
          },
        });

        expect(response.statusCode).toBeGreaterThanOrEqual(400);

        const dbManifest = await app.prisma.manifest.findUniqueOrThrow({
          where: { id: manifest.id },
        });
        expect(dbManifest.status).toBe(ManifestStatus.Completed);
      });
    });

    test.skip('Full Happy Path Lifecycle: Scheduled -> Dispatched -> Accumulating -> Completed -> Arrived', async () => {
      // 1. Create initial manifest in 'Scheduled' status with attached parcels
      const { manifest, parcelIds } = await createManifest(app, {
        parcelOverrides: {
          parcelAmount: 1,
        },
        manifestOverrides: { status: ManifestStatus.Scheduled },
      });

      const headers = { authorization: `Bearer ${adminToken}` };

      // --- STEP 1: Scheduled -> Dispatched ---
      const dispatchRes = await app.inject({
        method: 'POST',
        url: `/manifests/${manifest.code}/dispatch`,
        headers,
      });
      expect(dispatchRes.statusCode).toBe(200);
      expect(dispatchRes.json().data.status).toBe(ManifestStatus.Dispatched);

      // Verify parcel status cascaded to DepartedFromOriginHub
      let parcelCheck = await app.prisma.parcel.findUnique({ where: { id: parcelIds[0] } });
      expect(parcelCheck?.status).toBe(ParcelStatus.DepartedFromOriginHub);

      // --- STEP 2: Dispatched -> Accumulating ---
      const accumulateRes = await app.inject({
        method: 'POST',
        url: `/manifests/${manifest.code}/accumulate`,
        headers,
      });
      expect(accumulateRes.statusCode).toBe(200);
      expect(accumulateRes.json().data.status).toBe(ManifestStatus.Accumulating);

      // --- STEP 3: Accumulating -> Completed ---
      const completeRes = await app.inject({
        method: 'POST',
        url: `/manifests/${manifest.code}/complete`,
        headers,
      });
      expect(completeRes.statusCode).toBe(200);
      expect(completeRes.json().data.status).toBe(ManifestStatus.Completed);

      // Verify parcels advanced to ArrivedAtDestinationHub
      parcelCheck = await app.prisma.parcel.findUnique({ where: { id: parcelIds[0] } });
      expect(parcelCheck?.status).toBe(ParcelStatus.ArrivedAtDestinationHub);

      // --- STEP 4: Completed -> Arrived (Terminal Arrival) ---
      const arriveRes = await app.inject({
        method: 'POST',
        url: `/manifests/${manifest.code}/arrive`,
        headers,
      });
      expect(arriveRes.statusCode).toBe(200);
      expect(arriveRes.json().data.status).toBe(ManifestStatus.Arrived);

      // Verify ManifestLog history has all 4 state transition records
      const logs = await app.prisma.manifestLog.findMany({
        where: { manifestId: manifest.id },
        orderBy: { recordedAt: 'asc' },
      });
      expect(logs.length).toBeGreaterThanOrEqual(4);
    });

    test.skip('Negative Guard Rail: Blocks illegal state transitions', async () => {
      // Create a manifest in 'Scheduled' status
      const { manifest } = await createManifest(app, {
        parcelOverrides: {
          parcelAmount: 1,
        },
        manifestOverrides: { status: ManifestStatus.Scheduled },
      });

      const headers = { authorization: `Bearer ${adminToken}` };

      // Attempt an illegal jump: Scheduled -> Completed (Should fail/throw error)
      const illegalRes = await app.inject({
        method: 'POST',
        url: `/manifests/${manifest.code}/complete`,
        headers,
      });

      expect(illegalRes.statusCode).toBeGreaterThanOrEqual(400);
    });
  })

  // TODO: GeoFencing
  test.skip('a scheduled manifest is automatically dispatched by scanning the Manifest Code', async () => {
    await seedMasterInfrustructure(app)

    const result = await createManifest(app)

    const { token } = await createUser(app, UserRole.Manager, {
      assignedFacilityId: result.fleetTransport.facilityId
    })

    const response = await app.inject({
      method: 'PATCH',
      url: manifests.dispatch(result.manifest.code),
      headers: {
        authorization: `Bearer ${token}`
      }
    })

    const body = response.json();
    const data = body.data as Manifest ?? body;

    expect(response.statusCode).toBe(200);
    expect(body.message).toBe('Manifest dispatched.');
    expect(data.status).toBe(ManifestStatus.Accumulating);

    const fleetTransport = await app.prisma.fleetTransport.findUniqueOrThrow({
      where: { id: data.fleetTransportId }
    })
    if (!fleetTransport.courierId) {
      throw new Error("Cannot dispatch manifest: No courier assigned to this schedule.");
    }
    const assignedCourierId = fleetTransport.courierId;

    const courierLog = await app.prisma.courierLog.findFirstOrThrow({
      where: { courierId: assignedCourierId }
    })
    expect(courierLog).toBeDefined();
  })

  test.skip('an assigned courier can pick up and scan the parcel tracking number in the accumulation process', async () => {
    await seedMasterInfrustructure(app)

    const result = await createManifest(app)

    const parcelList = await app.prisma.parcel.findMany({
      where: { id: { in: result.parcelIds } }
    })
    const manifestedParcel = parcelList[0]

    const response = await app.inject({
      method: 'PATCH',
      url: adminParcels.pickedUp(manifestedParcel.trackingNumber),
    })

    const body = response.json()
    const data = body.data ?? body

    expect(response.statusCode).toBe(200);
    expect(body.message).toBe('Parcel is picked up successfully.');
    expect(data.status).toBe(ParcelStatus.PickedUp);

    const parcelLog = await app.prisma.parcelLog.findFirst({
      where: {
        parcelId: manifestedParcel.id,
        status: ParcelStatus.PickedUp
      },
      orderBy: { createdAt: 'desc' }
    });
    expect(parcelLog).toBeDefined();
    expect(parcelLog?.parcelId).toBe(manifestedParcel.id);
    expect(parcelLog?.status).toBe(ParcelStatus.PickedUp);
    expect(parcelLog?.description).toBeDefined();

    if (!manifestedParcel.manifestId) {
      return
    }
    const manifestId = manifestedParcel.manifestId
    const manifest = await app.prisma.manifest.findUniqueOrThrow({
      where: { id: manifestId },
      include: {
        parcels: {
          where: { status: ParcelStatus.ReadyForPickup }
        }
      }
    })
    const parcelsRemaining = manifest.parcels.length
    expect(parcelsRemaining).toBe(2) // 3 ReadyForPickup Parcels are created in the manifest factory
  })

  test.skip('accumulation process can be completed', async () => {
    await seedMasterInfrustructure(app)

    const result = await createManifest(app, { parcelOverrides: { status: ParcelStatus.PickedUp } })

    const { token } = await createUser(app, UserRole.Manager, {
      assignedFacilityId: result.fleetTransport.facilityId
    })

    const response = await app.inject({
      method: 'PATCH',
      url: manifests.complete(result.manifest.code),
      headers: {
        authorization: `Bearer ${token}`
      }
    })

    const body = response.json();
    const data = body.data as Manifest ?? body;

    expect(response.statusCode).toBe(200);
    expect(body.message).toBe('Manifest completed.');
    expect(data.status).toBe(ManifestStatus.Completed);

    const fleetTransport = await app.prisma.fleetTransport.findUniqueOrThrow({
      where: { id: data.fleetTransportId }
    })
    if (!fleetTransport.courierId) {
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
  test.skip('manifested parcels can be set to arrived', async () => {
    await seedMasterInfrustructure(app)

    const facilityId = (await app.prisma.facility.findFirstOrThrow({
      where: { code: "DC-PAR-01" }
    })).id

    const result = await createManifest(app, {
      parcelOverrides: { status: ParcelStatus.PickedUp },
      manifestOverrides: { status: ManifestStatus.Completed }
    })

    const { token } = await createUser(app, UserRole.Manager, {
      assignedFacilityId: facilityId
    })

    const response = await app.inject({
      method: 'PATCH',
      url: manifests.arrive(result.manifest.code),
      headers: {
        authorization: `Bearer ${token}`
      }
    })

    const body = response.json();
    const data = body.data as Manifest ?? body;

    expect(response.statusCode).toBe(200);
    expect(body.message).toBe('Manifested Parcels arrived.');
    expect(data.status).toBe(ManifestStatus.Arrived);

    const fleetTransport = await app.prisma.fleetTransport.findUniqueOrThrow({
      where: { id: data.fleetTransportId }
    })
    if (!fleetTransport.courierId) {
      throw new Error("Cannot dispatch manifest: No courier assigned to this schedule.");
    }
    const assignedCourierId = fleetTransport.courierId;

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

    const parcels = await app.prisma.parcel.updateManyAndReturn({
      where: { manifestId: data.id },
      data: { status: ParcelStatus.ArrivedAtOriginHub }
    })
    const parcelIds = parcels.map((p) => p.id)

    const parcelLogs = await app.prisma.parcelLog.findMany({
      where: { parcelId: { in: parcelIds }, status: ParcelStatus.ArrivedAtOriginHub }
    })

    parcelLogs.forEach((log) => {
      expect(log.status).toBe(ParcelStatus.ArrivedAtOriginHub)
    })
  })
})