import { CourierStatus, FacilityType, TransitMode, UserRole, VehicleType } from "@prisma/client";
import { FastifyInstance } from "fastify";
import { createFacility } from "../../tests/factory/facility.factory.js"
import { createSector } from "../../tests/factory/sector.factory.js";
import { createPhysicalVehicle } from "../../tests/factory/vehicles.factory.js";
import { createCourier } from "../../tests/factory/courier.factory.js";
import { createUser } from "../../tests/factory/user.factory.js";
import { createNetworkLeg } from "../../tests/factory/network-leg.factory.js";

export interface Schedule {
  openingTime: string;
  closingTime: string;
  cutOffTime: string;
}

export interface Actors {
  couriers: Array<any>;
  operators: Array<any>;
}

export interface Facility {
  name: string;
  code: string;
  address: string;
  type: FacilityType;
  longitude: number;
  latitude: number;
  parentCode: null | string;
  sectors: Array<any>;
  vehicles: Array<any>;
  actors: Actors;
  schedule: Schedule;
  networkLegs: Array<any>;
}

export async function seedFacilities(fastify: FastifyInstance, facilites: Facility[]) {
  try {
    console.log(`Seeding Facilities...`)

    for (const facility of facilites) {
      console.log(`Creating Facility ${facility.name}...`)

      let parentId: number | null = null
      if (facility.parentCode) {
        parentId = (await fastify.prisma.facility.findFirstOrThrow({
          where: { code: facility.parentCode },
          select: { id: true }
        })).id
      }

      const node = await createFacility(fastify, {
        name: facility.name,
        code: facility.code,
        address: facility.address,
        type: facility.type,
        longitude: facility.longitude,
        latitude: facility.latitude,
        parentId
      })
      // console.log({ node })

      console.log(`Creating Facility ${facility.name} complete!`)

      await seedSectors(fastify, node.id, facility.name, facility.sectors)

      await seedNetworkLegs(fastify, facility.name, facility.networkLegs)

      await seedVehicles(fastify, node.id, facility.name, facility.vehicles)

      await seedActors(fastify, node.id, facility.actors['couriers'], facility.actors['operators'], facility.name, facility.code)

      await seedSchedule(fastify, node.id, facility.name, facility.schedule)
    }
    console.log('Seeding Facilities complete!')
  } catch (error) {
    console.error("Seeding Facilities process failed:", error)
  }
}

async function seedSectors(fastify: FastifyInstance, facilityId: number, facilityName: string, sectors: Array<any>) {
  try {
    console.log(`Seeding ${facilityName} Sectors...`)

    for (const sector of sectors) {
      console.log(`Creating Facility Sector ${sector.code} with ${sector.barangayIds.length} Barangays...`)

      const facilitySector = {
        ...sector,
        localBranchId: facilityId
      }

      const sectorData = await createSector(fastify, facilitySector)
      // const sectorBarangays = await fastify.prisma.sector.findUniqueOrThrow({
      //   where: { id: sectorData.id },
      //   include: { barangays: true }
      // })
      // console.log(sectorBarangays)

      console.log(`Creating Facility Sector ${sector.code} with ${sector.barangayIds.length} Barangays complete!`)
    }

    // const facilitySectors = await fastify.prisma.$queryRaw<any[]>`
    //   SELECT 
    //     "id", 
    //     "code", 
    //     "local_branch_id" AS "localBranchId", 
    //     ST_AsGeoJSON("zone")::json AS "zone",
    //     "created_at" AS "createdAt", 
    //     "updated_at" AS "updatedAt"
    //   FROM "sectors"
    // `;
    // console.log(facilitySectors);

    console.log(`Seeding ${facilityName} Sectors complete!`)
  } catch (error) {
    console.error(`Seeding ${facilityName} Sectors process failed:`, error)
  }
}

async function seedNetworkLegs(fastify: FastifyInstance, facilityName: string, networkLegs: Array<any>) {
  if (networkLegs.length === 0) return
  
  try {
    console.log(`Seeding ${facilityName} Network Legs...`)

    for (const networkLeg of networkLegs) {
      const sourceFacilityId = (await fastify.prisma.facility.findFirstOrThrow({
        where: { code: networkLeg.sourceFacilityCode },
        select: { id: true }
      })).id

      const destinationFacilityId = (await fastify.prisma.facility.findFirstOrThrow({
        where: { code: networkLeg.destinationFacilityCode },
        select: { id: true }
      })).id

      const networkLegData = {
        sourceFacilityId,
        destinationFacilityId,
        ...networkLeg
      }

      await createNetworkLeg(fastify, networkLegData)
    }
    // const facilityNetworkLegs = await fastify.prisma.networkLeg.findMany()
    // console.log(facilityNetworkLegs)

    console.log(`Seeding ${facilityName} Network Legs complete!`)
  } catch (error) {
    console.error(`Seeding ${facilityName} Network Legs process failed:`, error)
  }
}

async function seedVehicles(fastify: FastifyInstance, facilityId: number, facilityName: string, vehicles: Array<any>) {
  try {
    console.log(`Seeding ${facilityName} Vehicles...`)

    for (const vehicle of vehicles) {
      const vehicleProfile = await fastify.prisma.vehicleProfile.findFirstOrThrow({
        where: { variant: vehicle.variant }
      })
      for (let i = 1; i <= vehicle.total; i++) {
        const { total, ...trimmedVehicle } = vehicle
        const vehicleData = {
          ...trimmedVehicle,
          vehicleProfileId: vehicleProfile.id,
          assignedFacilityId: facilityId,
          plateNumber: `${vehicle.plateNumber}${String(i).padStart(2, '0')}`
        }
        await createPhysicalVehicle(fastify, vehicleData)
      }
    }
    // const physicalVehicles = await fastify.prisma.physicalVehicle.findMany()
    // console.log(physicalVehicles)

    console.log(`Seeding ${facilityName} Vehicles complete!`)
  } catch (error) {
    console.error(`Seeding ${facilityName} Vehicles process failed:`, error)
  }
}

async function seedActors(fastify: FastifyInstance, facilityId: number, couriers: Array<any>, operators: Array<any>, facilityName: string, facilityCode: string) {
  try {
    if (couriers.length !== 0) {
      console.log(`Seeding ${facilityName} Couriers...`)

      for (const courier of couriers) {
        for (let i = 1; i <= courier.total; i++) {
          const padding = String(i).padStart(2, '0')
          const citySegment = facilityCode.split('-').at(1)?.toLowerCase()

          await createCourier(fastify, {
            userOverrides: {
              email: `crr-${courier.vehicleType.toLowerCase()}-${citySegment}-${padding}@example.com`,
              password: 'secretPassword123',
              firstName: `Courier ${citySegment}-${padding} First Name`,
              lastName: `Courier ${citySegment}-${padding} Last Name`,
              role: UserRole.Courier,
              assignedFacilityId: facilityId,
            },
            vehicleType: courier.vehicleType,
            status: CourierStatus.Available,
          })
        }
      }
      // const facilityCouriers = await fastify.prisma.courier.findMany()
      // console.log(facilityCouriers)

      console.log(`Seeding ${facilityName} Couriers complete!`)
    }
  } catch (error) {
    console.error(`Seeding ${facilityName} Couriers process failed:`, error)
  }

  try {
    if (operators.length !== 0) {

      console.log(`Seeding ${facilityName} Operators...`)

      for (const operator of operators) {
        for (let i = 1; i <= operator.total; i++) {
          const padding = String(i).padStart(2, '0')
          const citySegment = facilityCode.split('-').at(1)?.toLowerCase()

          await createUser(fastify, operator.role, {
            email: `mgr-${operator.role.toLowerCase()}-${citySegment}-${padding}@example.com`,
            password: 'secretPassword123',
            firstName: `${operator.role} ${citySegment}-${padding} First Name`,
            lastName: `${operator.role} ${citySegment}-${padding} Last Name`,
            assignedFacilityId: facilityId,
          })
        }
      }
      // const facilityOperators = await fastify.prisma.user.findMany()
      // console.log(facilityOperators)

      console.log(`Seeding ${facilityName} Operators complete!`)
    }

  } catch (error) {
    console.error(`Seeding ${facilityName} Operators process failed:`, error)
  }
}

async function seedSchedule(fastify: FastifyInstance, facilityId: number, facilityName: string, schedule: Schedule) {
  const isEmpty = (obj: object) => Object.keys(obj).length === 0;
  
  if (isEmpty(schedule)) return

  try {
    console.log(`Seeding ${facilityName} Schedule...`)

    await fastify.prisma.facilitySchedule.create({
      data: {
        facilityId,
        ...schedule,
      }
    })
    // const schedules = await fastify.prisma.facilitySchedule.findMany()
    // console.log(schedules)

    console.log(`Seeding ${facilityName} Schedule complete!`)
  } catch (error) {
    console.error(`Seeding ${facilityName} Schedule process failed:`, error)
  }
}
