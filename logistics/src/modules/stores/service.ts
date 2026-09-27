import { Coordinates } from "#commons/types.js";
import { PrismaClient } from "@prisma/client/extension";

interface CreateStoreData {
  name: string;
  contactNumber: string;
  address: string;
  coordinates: Coordinates
}

export async function createStore(prisma: PrismaClient, data: CreateStoreData) {
  return await prisma.$queryRaw<any[]>`
    INSERT INTO "stores" (
      "name",
      "contact_number",
      "address",
      "location",
      "updated_at"
    ) VALUES (
      ${data.name},
      ${data.contactNumber},
      ${data.address},
      ST_SetSRID(ST_MakePoint(${parseFloat(data.coordinates.longitude)}, ${parseFloat(data.coordinates.latitude)}), 4326),
      NOW()
    )
    RETURNING *;
  `
}