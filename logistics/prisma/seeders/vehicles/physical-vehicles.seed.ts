import { FastifyInstance } from "fastify";
import { createVehicleProfile } from "../../../tests/factory/vehicles.factory.js";

export async function seedVehicleProfiles(app: FastifyInstance, count: number = 15) {
  console.log(`Seeding ${count} vehicle profiles...`);

  const brands = ['Isuzu', 'Mitsubishi', 'Toyota', 'Ford', 'Foton', 'Hyundai', 'Hino'];
  const types = ['Van', 'Truck', 'Motorcycle', 'Car'];

  for (let i = 1; i <= count; i++) {
    const brand = brands[Math.floor(Math.random() * brands.length)];
    const type = types[Math.floor(Math.random() * types.length)];
    
    await createVehicleProfile(app, {
      brand: brand,
      modelName: `${type} Series ${Math.floor(Math.random() * 900) + 100}`,
      variant: i % 2 === 0 ? 'Standard' : 'Heavy Duty',
      maxWeightCapacityG: Math.floor(Math.random() * 5000000) + 500000, // 500kg to 5.5 tons
      maxUsableVolumeCbm: parseFloat((Math.random() * 15 + 1).toFixed(2)), // 1 to 16 m³
      type: type,
    });
  }
  
  console.log(`Successfully seeded ${count} vehicle profiles!`);
}