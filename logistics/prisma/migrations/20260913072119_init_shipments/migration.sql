-- CreateTable
CREATE TABLE "Shipments" (
    "id" SERIAL NOT NULL,
    "tracking_number" TEXT NOT NULL,
    "barcode" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "origin_zone" TEXT NOT NULL,
    "destination_zone" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shipments_pkey" PRIMARY KEY ("id")
);
