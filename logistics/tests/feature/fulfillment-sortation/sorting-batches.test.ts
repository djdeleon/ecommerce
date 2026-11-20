import { createFacility } from "#factory"
import { ShipmentStatus, ManifestStatus, UserRole, Courier, FleetTransportType, SortingBatchStatus, MasterBagStatus } from "@prisma/client"
import { FastifyInstance } from "fastify"
import { describe, beforeAll, test, expect } from "vitest"
import { seedMasterInfrustructure } from "../../../prisma/seeders/tests/master-infrastructure-tests.seed.js"
import { fleetTransports } from "../../../src/modules/fleet-transports/paths.js"
import { parcels } from "../../../src/modules/parcels/paths.js"
import { sortingBatches } from "../../../src/modules/fulfillment-sortation/paths/sorting-batch.path.js"
import { createFleetTransport } from "../../factory/fleet-transport.factory.js"
import { createManifest } from "../../factory/manifest.factory.js"
import { createUser } from "../../factory/user.factory.js"
import { createSortingBatch } from "../../factory/sorting-batch.factory.js"
import { createMasterBag } from "../../factory/master-bag.factory.js"

describe('Sorting Batch Management', () => {
  let app: FastifyInstance

  beforeAll(() => {
    app = (globalThis as any).app as FastifyInstance
  })

  describe('manual sortation', () => {
    test('arrived parcels can be set to bagged', async () => {
      await seedMasterInfrustructure(app)

      const result = await createManifest(app, {
        parcelOverrides: { status: ShipmentStatus.ArrivedAtOriginHub },
        manifestOverrides: { status: ManifestStatus.Arrived }
      })

      const selectedParcel = await app.prisma.parcel.findUniqueOrThrow({
        where: { id: result.parcelIds[0] }
      })

      const response = await app.inject({
        method: 'PATCH',
        url: parcels.bagged(selectedParcel.trackingNumber)
      })

      const body = response.json()
      const data = body.data ?? body

      expect(response.statusCode).toBe(200);
      expect(body.message).toBe('Parcel is bagged successfully.');
      expect(data.status).toBe(ShipmentStatus.Bagged);

      const trackingLog = await app.prisma.trackingLog.findFirst({
        where: {
          parcelId: selectedParcel.id,
          status: ShipmentStatus.Bagged
        },
        orderBy: { createdAt: 'desc' }
      });
      expect(trackingLog).toBeDefined();
      expect(trackingLog?.parcelId).toBe(selectedParcel.id);
      expect(trackingLog?.status).toBe(ShipmentStatus.Bagged);
      expect(trackingLog?.description).toBeDefined();
    })

    test('bagged parcels can be scheduled to move on to the next facility', async () => {
      await seedMasterInfrustructure(app)

      const result = await createManifest(app, {
        parcelOverrides: { status: ShipmentStatus.ArrivedAtOriginHub },
        manifestOverrides: { status: ManifestStatus.Arrived }
      })

      const { id: facilityId, sectors, vehicles: vehicleList, users: couriers, sourceLegs } = await app.prisma.facility.findFirstOrThrow({
        where: { code: "DC-PAR-01" },
        include: {
          sectors: true,
          vehicles: true,
          users: {
            where: { role: UserRole.Courier },
            include: { courier: true }
          },
          sourceLegs: true,
        },
      })
      const selectedVehicle = vehicleList[0]
      const selectedCourier = couriers[0].courier as Courier
      const selectedNetworkLeg = sourceLegs[0] // 'LEG-PAR-MNL-IN'
      const { token } = await createUser(app, UserRole.Manager, { assignedFacilityId: facilityId })

      const payload = {
        courierId: selectedCourier.id,
        vehicleId: selectedVehicle.id,
        networkLegId: selectedNetworkLeg.id,
        scheduledFor: FleetTransportType.LineHaul,
        scheduledTime: "2026-10-23T08:00:00.000Z",
      }
      const response = await app.inject({
        method: 'POST',
        url: fleetTransports.store,
        headers: {
          authorization: `Bearer ${token}`
        },
        body: payload
      })

      const body = response.json();
      const data = body.data ?? body;

      expect(response.statusCode).toBe(201);
      expect(body.message).toBe('Fleet Transport created successfully.');

      expect(data.id).toBeDefined();
      expect(data.courierId).toBe(selectedCourier.id);
      expect(data.vehicleId).toBe(selectedVehicle.id);
      expect(data.networkLegId).toBe(selectedNetworkLeg.id);
    })

    test('bagged parcels can be set to departed from hub', async () => {
      await seedMasterInfrustructure(app)

      const result = await createManifest(app, {
        parcelOverrides: { status: ShipmentStatus.Bagged },
        manifestOverrides: { status: ManifestStatus.Arrived }
      })

      const selectedParcel = await app.prisma.parcel.findUniqueOrThrow({
        where: { id: result.parcelIds[0] }
      })

      const response = await app.inject({
        method: 'PATCH',
        url: parcels.departedFromHub(selectedParcel.trackingNumber)
      })

      const body = response.json()
      const data = body.data ?? body

      expect(response.statusCode).toBe(200);
      expect(body.message).toBe('Parcel is departed from hub successfully.');
      expect(data.status).toBe(ShipmentStatus.DepartedFromHub);

      const trackingLog = await app.prisma.trackingLog.findFirst({
        where: {
          parcelId: selectedParcel.id,
          status: ShipmentStatus.DepartedFromHub
        },
        orderBy: { createdAt: 'desc' }
      });
      expect(trackingLog).toBeDefined();
      expect(trackingLog?.parcelId).toBe(selectedParcel.id);
      expect(trackingLog?.status).toBe(ShipmentStatus.DepartedFromHub);
      expect(trackingLog?.description).toBeDefined();
    })

    test('a departed parcel can be set to arrived at hub', async () => {
      await seedMasterInfrustructure(app)

      // Static Routing Pipeline ("DC-PAR-01 > GW-MNL-01 > BR-MAR-01")
      const originFacility = await app.prisma.facility.findFirstOrThrow({
        where: { code: "DC-PAR-01" }
      })
      const destinationFacility = await app.prisma.facility.findFirstOrThrow({
        where: { code: "BR-MAR-01" } // Final Destination not the next one
      })

      const result = await createManifest(app, {
        parcelOverrides: {
          status: ShipmentStatus.DepartedFromHub,
          originFacilityId: originFacility.id,
          currentFacilityId: originFacility.id,
          destinationFacilityId: destinationFacility.id,
          sortingCodeCache: "NCR-MTR-MAR-S01",
          routingPipelineCache: "DC-PAR-01 > GW-MNL-01 > BR-MAR-01",
        },
        manifestOverrides: { status: ManifestStatus.Arrived }
      })

      const selectedParcel = await app.prisma.parcel.findUniqueOrThrow({
        where: { id: result.parcelIds[0] }
      })

      const response = await app.inject({
        method: 'PATCH',
        url: parcels.arrivedAtHub(selectedParcel.trackingNumber)
      })

      const body = response.json()
      const data = body.data ?? body
      expect(response.statusCode).toBe(200);
      expect(body.message).toBe('Parcel has arrived at hub successfully.');
      expect(data.status).toBe(ShipmentStatus.ArrivedAtHub);

      expect(data.originFacilityId).toBe(2)
      expect(data.currentFacilityId).toBe(1)
      expect(data.destinationFacilityId).toBe(3)
    })

    test('automated tunnel scanner audits and routes parcel to sorting', async () => {
      await seedMasterInfrustructure(app)

      await createSortingBatch(app, { status: SortingBatchStatus.Active })

      // Static Routing Pipeline ("DC-PAR-01 > GW-MNL-01 > BR-MAR-01")
      const originFacility = await app.prisma.facility.findFirstOrThrow({
        where: { code: "DC-PAR-01" }
      })
      const destinationFacility = await app.prisma.facility.findFirstOrThrow({
        where: { code: "BR-MAR-01" } // Final Destination not the next one
      })

      const { token } = await createUser(app, UserRole.Manager, { assignedFacilityId: originFacility.id })

      const result = await createManifest(app, {
        parcelOverrides: {
          status: ShipmentStatus.DepartedFromHub,
          originFacilityId: originFacility.id,
          currentFacilityId: originFacility.id,
          destinationFacilityId: destinationFacility.id,
          sortingCodeCache: "NCR-MTR-MAR-S01",
          routingPipelineCache: "DC-PAR-01 > GW-MNL-01 > BR-MAR-01",
        },
        manifestOverrides: { status: ManifestStatus.Arrived }
      })

      const selectedParcel = await app.prisma.parcel.findUniqueOrThrow({
        where: { id: result.parcelIds[0] }
      })

      const response = await app.inject({
        method: 'POST',
        url: sortingBatches.tunnelScan(selectedParcel.trackingNumber),
        headers: {
          authorization: `Bearer ${token}`
        },
      });

      const body = response.json();
      const data = body.data ?? body;
      const { auditedParcel, nextFacilityCode } = data.data

      expect(response.statusCode).toBe(200);
      expect(body.message).toBe('Parcel scanned successfully.');

      expect(data.tunnelSensorStatus).toBe('SUCCESS');
      expect(data.hardwareMessage).toBeDefined();

      expect(nextFacilityCode).toBe("GW-MNL-01");
      expect(auditedParcel).toBeDefined();
      expect(auditedParcel.parcelId).toBe(selectedParcel.id);
      expect(auditedParcel.weightGrams).toBeGreaterThan(0);
      expect(auditedParcel.calculatedCbm).toBeGreaterThan(0);

      const updatedParcel = await app.prisma.parcel.findUnique({
        where: { id: selectedParcel.id }
      });
      expect(updatedParcel?.status).toBe(ShipmentStatus.Sorting);

      const auditLog = await app.prisma.parcelAuditLog.findUnique({
        where: { parcelId: selectedParcel.id }
      });
      expect(auditLog).toBeDefined();
      expect(auditLog?.weightGrams).toBe(auditedParcel.weightGrams);

      const trackingLog = await app.prisma.trackingLog.findFirst({
        where: {
          parcelId: selectedParcel.id,
          status: ShipmentStatus.Sorting
        },
        orderBy: { createdAt: 'desc' }
      });
      expect(trackingLog).toBeDefined();
      expect(trackingLog?.description).toContain('Automated scanner tunnel audit');
    });

    // Reserved for GPS Simulation (Both Arrive and Dispatch need an endpoint)
    test.skip('a bagged parcel and sealed master bag can depart from hub', async () => {
      await seedMasterInfrustructure(app)

      const result = await createManifest(app, {
        parcelOverrides: { status: ShipmentStatus.ArrivedAtOriginHub },
        manifestOverrides: { status: ManifestStatus.Arrived }
      })

      const { id: facilityId, sectors, vehicles, users: couriers, sourceLegs } = await app.prisma.facility.findFirstOrThrow({
        where: { code: "GW-MNL-01" },
        include: {
          sectors: true,
          vehicles: true,
          users: {
            where: { role: UserRole.Courier },
            include: { courier: true }
          },
          sourceLegs: true,
        },
      })
      const selectedVehicle = vehicles[0]
      const selectedCourier = couriers[0].courier as Courier
      const selectedNetworkLeg = sourceLegs[1] // 'LEG-MNL-MAR-OUT'

      const courierSchedule = await createFleetTransport(app, {
        scheduledFor: FleetTransportType.LineHaul,
        courierId: selectedCourier.id,
        vehicleId: selectedVehicle.id,
        networkLegId: selectedNetworkLeg.id,
      })

      // Now, this is where the driver is going to scan the master bag to dispatch
      // - we gonna hit another master bag endpoint
      const masterBag = await createMasterBag(app, {
        status: MasterBagStatus.Sealed
      })

      /**
       * GeoFencing
       * - This is where we gonna integrate the gps (VehicleLocationLogs)
       */

      // From coordsPointA to coordsPointB is 123.74meters (Haversine)
      const coordsPointA = [
        120.98091,
        14.59009
      ]
      const coordsPointB = [
        120.98056,
        14.59115
      ]
      const longitudeDiff = 0.00035 // 120.98091 - 120.98056
      const latitudeDiff = -0.00106 // 14.59009 - 14.59115
      // so to move the Dot from Point A to Point B (Simulating the Vehicle GPS Movement)
      // First the Longitude of Point A should get from 120.98091 to 120.98056
      // - which we can subtract Point A's Longitude to Point B's Longitude which is 0.00035
      // - - We can use this longitudeDiff to decrementally subtract the Point A' Longitude
      // Second the Latitude
      // - we need to incrementally add the latitudeDiff
    })
    test.skip('a bagged parcel and sealed master bag can arrive at the destination hub', async () => {

    })

    test.skip('a bagged parcel and sealed master bag at the destination hub can be sorted to their designated sectors', async () => {
      await seedMasterInfrustructure(app)

      await createSortingBatch(app, { status: SortingBatchStatus.Active })

      // Static Routing Pipeline ("DC-PAR-01 > GW-MNL-01 > BR-MAR-01")
      const originFacility = await app.prisma.facility.findFirstOrThrow({
        where: { code: "DC-PAR-01" }
      })
      const destinationFacility = await app.prisma.facility.findFirstOrThrow({
        where: { code: "BR-MAR-01" } // Final Destination not the next one
      })

      const result = await createManifest(app, {
        parcelOverrides: {
          status: ShipmentStatus.DepartedFromHub,
          originFacilityId: originFacility.id,
          currentFacilityId: originFacility.id,
          destinationFacilityId: destinationFacility.id,
          sortingCodeCache: "NCR-MTR-MAR-S01",
          routingPipelineCache: "DC-PAR-01 > GW-MNL-01 > BR-MAR-01",
        },
        manifestOverrides: { status: ManifestStatus.Arrived }
      })

      const selectedParcel = await app.prisma.parcel.findUniqueOrThrow({
        where: { id: result.parcelIds[0] }
      })

      const sortingCodeSegments = selectedParcel.sortingCodeCache.split('-')
      const sectorKey = sortingCodeSegments[sortingCodeSegments.length - 1]
      console.log(sectorKey)

      const destinationSector = await app.prisma.sector.findUniqueOrThrow({
        where: { id: selectedParcel.destinationSectorId }
      })
      console.log(destinationSector)
      return

      const response = await app.inject({
        method: 'POST',
        url: sortingBatches.tunnelScan(selectedParcel.trackingNumber),
      });
    })

    test.skip('an arrived at hub parcel can be moved to the next destination facility', async () => {
      await seedMasterInfrustructure(app)

      // Static Routing Pipeline ("DC-PAR-01 > GW-MNL-01 > BR-MAR-01")
      const originFacility = await app.prisma.facility.findFirstOrThrow({
        where: { code: "DC-PAR-01" }
      })
      const destinationFacility = await app.prisma.facility.findFirstOrThrow({
        where: { code: "BR-MAR-01" } // Final Destination not the next one
      })
      const currentFacility = await app.prisma.facility.findFirstOrThrow({
        where: { code: "GW-MNL-01" } // Parcel is currently at MNL Gateway
      })

      const result = await createManifest(app, {
        parcelOverrides: {
          status: ShipmentStatus.ArrivedAtHub,
          originFacilityId: originFacility.id,
          currentFacilityId: currentFacility.id,
          destinationFacilityId: destinationFacility.id,
          sortingCodeCache: "NCR-MTR-MAR-S01",
          routingPipelineCache: "DC-PAR-01 > GW-MNL-01 > BR-MAR-01",
        },
        manifestOverrides: { status: ManifestStatus.Arrived }
      })

      const selectedParcel = await app.prisma.parcel.findUniqueOrThrow({
        where: { id: result.parcelIds[0] }
      })

      const sortingBatch = await createSortingBatch(app, {
        status: SortingBatchStatus.Active // simulates the running of the Converyor Belt
      })
      console.log({ selectedParcel, sortingBatch })
      return

      /**
       * This is now where we have sorting batch
       * - I think the next parcel status transition would be 'Sorted'
       * - when do we begin the Sortation?
       * - - I think we can virtually think that a facility has a "Sorting Machine" that runs thrice a day.
       * - - this runs in schedule.
       * - - let's add some constraints
       * - - - in the morning, it only runs when there are 3 or more
       * - - - it runs again in the morning when the other batch of 3 or more parcels are ready to be sorted
       * - - - it runs the last time in the afternoon for the last sortation of the day.
       */

      /**
       * Based on Falcon's YT Video
       * 1. Bulk Random Parcels feeding the Sorting Machine
       * - at this point there's no tracking needed for the parcel status
       * 2. Orientation
       * - For the parcel to face the Barcode Scanner in the middle of the Sorting Machine
       * - But I'll go with Multi-Sided Barcode Scanners so it doesn't matter where the parcel is facing
       * 3. Weighing
       * 4. Spacing
       * 5. Tunnel Scan (Barcode and Dimension)
       * - the parcel is scanned ('Sorting')
       * 6. Sorting into Collection Chutes
       * - no need to have a schema for the chutes, it is the physical representation of a facility
       * 7. Secondary Sorting into Master Bags (With Master Barcode)
       * - the parcel is scanned ('Bagged')
       * 
       * next would be scheduling the outbound. MNL to MAR
       * 
       * TODO: DO THE SIMULATION HARDWARE SENDOR ENDPOINTS (TUNNEL BARCODE SCAN, WEIGH, DIMENSION)
       * - For Parcel Attribute Audit
       */

      const response = await app.inject({
        method: 'PATCH',
        url: parcels.arrivedAtHub(selectedParcel.trackingNumber)
      })

      const body = response.json()
      const data = body.data ?? body
    })

    /**
     * Sortation Lifecycle
     * 
     * Sortation of what?
     * - Parcels
     * 
     * Sortation is Arrange with?
     * 
     * Sortation begins at?
     * - when the parcel is arrived at the local branch.
     * 
     * Sortation ends at?
     * 
     */

    /**
     * For manual sorting, the parcel status is at ArrivedAtOriginHub
     * - We will directly transition to "Departed From Origin"
     * - I think we need to do "Bagged/In Cargo" then "Departed From Origin Hub"
     */
  })

  test('sortation batches can be listed', async () => {
    const { token } = await createUser(app, UserRole.Manager)
    await createSortingBatch(app)

    const response = await app.inject({
      method: 'GET',
      url: sortingBatches.index,
      headers: {
        authorization: `Bearer ${token}`
      }
    })
    
    const body = response.json()

    expect(response.statusCode).toBe(200)
    expect(body.message).toBe('Sortation batches retrieved successfully.')
    expect(body.data).toHaveProperty('sortingBatches')
    expect(Array.isArray(body.data.sortingBatches)).toBe(true)
    expect(body.data.sortingBatches.length).toBeGreaterThan(0)
    expect(body.data.sortingBatches[0]).toMatchObject({
      id: expect.any(Number),
      code: expect.any(String),
      facilityId: expect.any(Number),
      status: expect.any(String),
      facility: expect.any(Object),
      _count: expect.any(Object),
    })
  })

  test('a sortation batch can be created', async () => {
    const facility = await createFacility(app)

    const { token } = await createUser(app, UserRole.Manager, { assignedFacilityId: facility.id })

    const payload = {
      startTime: "1970-01-01T18:00:00Z",
      endTime: "1970-01-01T04:00:00Z",
      cutOffTime: "1970-01-01T23:00:00Z",
      facilityId: facility.id,
    }

    const response = await app.inject({
      method: 'POST',
      url: sortingBatches.store,
      headers: {
        authorization: `Bearer ${token}`
      },
      body: payload
    })

    const body = response.json()

    expect(response.statusCode).toBe(201)
    expect(body.message).toBe('Sortation batch created successfully.')
    expect(body.data).toMatchObject({
      id: expect.any(Number),
      code: expect.any(String),
      facilityId: payload.facilityId,
      cutOffTime: expect.any(String),
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    })
  })

  test('a sortation batch can be retrieved by id', async () => {
    const { token } = await createUser(app, UserRole.Manager)
    const createdBatch = await createSortingBatch(app)

    const response = await app.inject({
      method: 'GET',
      url: sortingBatches.show(createdBatch.id),
      headers: {
        authorization: `Bearer ${token}`
      }
    })

    const body = response.json()

    expect(response.statusCode).toBe(200)
    expect(body.message).toBe('Sortation batch retrieved successfully.')
    expect(body.data).toMatchObject({
      id: createdBatch.id,
      code: createdBatch.code,
      facilityId: createdBatch.facilityId,
      facility: expect.any(Object),
      masterBags: expect.any(Array),
      looseParcels: expect.any(Array),
    })
  })

  test('a sortation batch can be updated', async () => {
    const { token } = await createUser(app, UserRole.Manager)

    const createdBatch = await createSortingBatch(app)

    const updatePayload = {
      status: SortingBatchStatus.Active,
    }

    const response = await app.inject({
      method: 'PUT',
      url: sortingBatches.update(createdBatch.id),
      headers: {
        authorization: `Bearer ${token}`
      },
      body: updatePayload
    })

    const body = response.json()

    expect(response.statusCode).toBe(200)
    expect(body.message).toBe('Sortation batch updated successfully.')
    expect(body.data).toMatchObject({
      id: createdBatch.id,
      status: updatePayload.status,
    })
  })

  test('a sortation batch can be deleted', async () => {
    const { token } = await createUser(app, UserRole.Manager)

    const createdBatch = await createSortingBatch(app)

    const response = await app.inject({
      method: 'DELETE',
      url: sortingBatches.delete(createdBatch.id),
      headers: {
        authorization: `Bearer ${token}`
      },
    })

    const body = response.json()

    expect(response.statusCode).toBe(200)
    expect(body.message).toBe('Sortation batch deleted successfully.')

    const deletedRecord = await app.prisma.sortingBatch.findUnique({
      where: { id: createdBatch.id },
    })
    expect(deletedRecord).toBeNull()
  })
})