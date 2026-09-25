import { prisma } from "../../src/commons/plugins/prisma.js"

export async function createStore(overrides = {}) {
  const longitude = (overrides as any).longitude ?? 14.59
  const latitude = (overrides as any).latitude ?? 120.98

  const store = await prisma.store.create({
    data: {
      name: "Store Factory",
      contactNumber: "09225356435",
      address: "Bulacan 123 Main St.",
      ...overrides
    }
  })

  await prisma.$executeRaw`
    UPDATE stores
    SET location = ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)
    WHERE id = ${store.id}
  `

  return store
}
