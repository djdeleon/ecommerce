import { FastifyInstance } from "fastify"
import { createVehicleProfile } from "../../tests/factory/vehicles.factory.js"
import { VehicleType } from "@prisma/client"

// Should be seeded before facilities, so when facility is being created we can create the physical vehicles and assign it to its designated facilities at the same time
const vehicleProfiles = [
  // =========================================================================
  // HONDA WAVE RSX WITH STANDARD 55L EXPRESS TOP-BOX
  // Best for fast documents, small e-commerce pouches, food, and high-priority items.
  // =========================================================================
  {
    "brand":                  "Honda",
    "modelName":              "Wave RSX Drum",
    "variant":                "55L Top-Box",
    "maxWeightCapacityG":     20000,             // 20 kg cargo weight safety limit for center of gravity
    "maxUsableVolumeCbm":     0.055,             // 55 Liters = 0.055 CBM
    "allocationVolumeTarget": 0.85,              // 85% - Easy to maximize rigid square boxes
    "lengthMm":               450,               // Internal box dimensions
    "widthMm":                400,
    "heightMm":               320,
    "type":                   VehicleType.Motorcycle
  },
  // =========================================================================
  // HONDA WAVE RSX WITH LARGE COURIER CANVAS SADDLEBAG ("BUDA")
  // The classic local courier setup for mass regional distribution.
  // =========================================================================
  {
    "brand":                  "Honda",
    "modelName":              "Wave RSX Drum",
    "variant":                "Large Saddlebag",
    "maxWeightCapacityG":     60000,             // 60 kg max capacity (30 kg evenly balanced on each side)
    "maxUsableVolumeCbm":     0.18,              // 180 Liters total side space = 0.18 CBM
    "allocationVolumeTarget": 0.70,              // 70% - Soft bags deform, leaving awkward air gaps
    "lengthMm":               500,               // Maximum linear length threshold for a single bag side
    "widthMm":                500,
    "heightMm":               720,
    "type":                   VehicleType.Motorcycle
  },
  // =========================================================================
  // MITSUBISHI L300 ALUMINUM VAN
  // The workhorse of urban linehauls, last-mile bulky shipments, and multi-drop routes.
  // =========================================================================
  {
    "brand":                  "Mitsubishi",
    "modelName":              "L300",
    "variant":                "Aluminum Van",
    "maxWeightCapacityG":     1000000,           // 1,000 kg (1 Ton) payload threshold for suspension safety
    "maxUsableVolumeCbm":     3.3,               // 3.3 Cubic Meters of enclosed cargo box space
    "allocationVolumeTarget": 0.75,              // 75% - Standard stacking efficiency allowing for structural wheel wells
    "lengthMm":               4200,              // Total vehicle external footprint baseline reference
    "widthMm":                1700,
    "heightMm":               1900,
    "type":                   VehicleType.Van
  },
  // =========================================================================
  // FOTON AUMAN EST (10-WHEELER HEAVY WING VAN)
  // The heavy mainline linehaul. Designed for massive hub-to-hub cross-docking.
  // =========================================================================
  {
    "brand":                  "Foton",
    "modelName":              "Auman EST-M 6x2",
    "variant":                "32ft Wing Van",
    "maxWeightCapacityG":     25000000,          // 25,000 kg (25 Tons) massive regional linehaul limit
    "maxUsableVolumeCbm":     58.5,              // ~9.58m x 2.45m x 2.5m inner cargo space dimension mapping
    "allocationVolumeTarget": 0.80,              // 80% - Good stacking for standard palletized network loads
    "lengthMm":               9580,              // Internal container length clearance 
    "widthMm":                2450,              // Internal width clearance
    "heightMm":               2500,              // Internal ceiling height clearance
    "type":                   VehicleType.Truck
  },
]

const weights = vehicleProfiles.map(v => v.maxWeightCapacityG);
const volumes = vehicleProfiles.map(v => v.maxUsableVolumeCbm);

export const vehicleProfilesStats = {
  minWeight: Math.min(...weights),
  maxWeight: Math.max(...weights),
  minVolume: Math.min(...volumes),
  maxVolume: Math.max(...volumes),
};

export async function seedVehicleProfiles(fastify: FastifyInstance) {
  try {
    console.log(`Seeding ${vehicleProfiles.length} Vehicle Profiles...`)
    for (const vehicleProfile of vehicleProfiles) {
      await createVehicleProfile(fastify, vehicleProfile)
    }
    // const vehicleProfilesData = await fastify.prisma.vehicleProfile.findMany()
    // console.log(vehicleProfilesData)

    console.log('Vehicle Profiles seeding complete!')
  } catch (error) {
    console.error("Seeding Vehicle Profiles process failed:", error)
  }
}