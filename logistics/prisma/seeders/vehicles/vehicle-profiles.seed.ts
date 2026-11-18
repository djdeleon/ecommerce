import { FastifyInstance } from "fastify"
import { createVehicleProfile } from "../../../tests/factory/vehicles.factory.js"
import { VehicleType } from "@prisma/client"

const coreVehicleProfiles = [
  {
    "brand": "Honda",
    "modelName": "Wave RSX Drum",
    "variant": "55L Top-Box",
    "maxWeightCapacityG": 20000,
    "maxUsableVolumeCbm": 0.055,
    "allocationVolumeTarget": 0.85,
    "lengthMm": 450,
    "widthMm": 400,
    "heightMm": 320,
    "type": VehicleType.Motorcycle
  },
  {
    "brand": "Honda",
    "modelName": "Wave RSX Drum",
    "variant": "Large Saddlebag",
    "maxWeightCapacityG": 60000,
    "maxUsableVolumeCbm": 0.18,
    "allocationVolumeTarget": 0.70,
    "lengthMm": 500,
    "widthMm": 500,
    "heightMm": 720,
    "type": VehicleType.Motorcycle
  },
  {
    "brand": "Mitsubishi",
    "modelName": "L300",
    "variant": "Aluminum Van",
    "maxWeightCapacityG": 1000000,
    "maxUsableVolumeCbm": 3.3,
    "allocationVolumeTarget": 0.75,
    "lengthMm": 4200,
    "widthMm": 1700,
    "heightMm": 1900,
    "type": VehicleType.Van
  },
  {
    "brand": "Foton",
    "modelName": "Auman EST-M 6x2",
    "variant": "32ft Wing Van",
    "maxWeightCapacityG": 25000000,
    "maxUsableVolumeCbm": 58.5,
    "allocationVolumeTarget": 0.80,
    "lengthMm": 9580,
    "widthMm": 2450,
    "heightMm": 2500,
    "type": VehicleType.Truck
  },
]

/**
 * Seeds vehicle profiles. 
 * Always seeds the core real-world data first, then fills the rest with random data.
 */
export async function seedVehicleProfiles(fastify: FastifyInstance, totalCount: number = 15) {
  try {
    console.log(`Starting Vehicle Profiles seeding (Target Total: ${totalCount})...`)

    for (const profile of coreVehicleProfiles) {
      await createVehicleProfile(fastify, profile)
    }

    const seededCount = coreVehicleProfiles.length
    const remainingToSeed = totalCount - seededCount

    if (remainingToSeed > 0) {
      console.log(`Generating ${remainingToSeed} additional random profiles...`)
      
      const randomBrands = ['Isuzu', 'Hino', 'Hyundai', 'Toyota', 'Ford', 'Suzuki', 'Nissan']
      const randomTypes = [VehicleType.Van, VehicleType.Truck, VehicleType.Motorcycle]

      for (let i = 1; i <= remainingToSeed; i++) {
        const brand = randomBrands[Math.floor(Math.random() * randomBrands.length)]
        const type = randomTypes[Math.floor(Math.random() * randomTypes.length)]
        
        await createVehicleProfile(fastify, {
          brand: brand,
          modelName: `${type} Gen-X ${100 + i}`,
          variant: i % 2 === 0 ? 'Standard' : 'Extended Range',
          maxWeightCapacityG: Math.floor(Math.random() * 5000000) + 100000,
          maxUsableVolumeCbm: parseFloat((Math.random() * 12 + 0.2).toFixed(3)),
          allocationVolumeTarget: 0.80,
          lengthMm: 2000 + (i * 150),
          widthMm: 1600,
          heightMm: 1800,
          type: type,
        })
      }
    }

    console.log(`Vehicle Profiles seeding complete! (Total: ${Math.max(seededCount, totalCount)})`)
  } catch (error) {
    console.error("Seeding Vehicle Profiles process failed:", error)
  }
}