CREATE EXTENSION IF NOT EXISTS postgis;

-- CreateEnum
CREATE TYPE "facility_type" AS ENUM ('mega_gateway', 'regional_hub', 'local_branch');

-- CreateEnum
CREATE TYPE "courier_status" AS ENUM ('available', 'busy', 'offline');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('admin', 'courier');

-- CreateEnum
CREATE TYPE "shipment_status" AS ENUM ('pending_pickup', 'ready_for_pickup', 'picked_up', 'in_transit', 'arrived_at_hub', 'out_for_delivery', 'delivered', 'failed_delivery', 'rejected');

-- CreateTable
CREATE TABLE "facilities" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" "facility_type" NOT NULL,
    "sorting_code" VARCHAR(50) NOT NULL,
    "address" TEXT NOT NULL,
    "location" geometry(Point, 4326),
    "parent_id" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "facilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_boundaries" (
    "id" SERIAL NOT NULL,
    "facility_id" INTEGER NOT NULL,
    "delivery_area" geometry(Polygon, 4326),

    CONSTRAINT "delivery_boundaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'courier',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "couriers" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "phone_number" VARCHAR(20) NOT NULL,
    "vehicle_type" VARCHAR(50) NOT NULL,
    "plate_number" VARCHAR(20) NOT NULL,
    "status" "courier_status" NOT NULL,
    "current_facility_id" SMALLINT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "couriers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "api_key" TEXT NOT NULL,
    "api_secret" TEXT NOT NULL,
    "webhook_url" TEXT NOT NULL,
    "webhook_secret" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tracking_number_pools" (
    "id" SERIAL NOT NULL,
    "tracking_number" VARCHAR(50) NOT NULL,
    "client_id" INTEGER NOT NULL,
    "is_assigned" BOOLEAN NOT NULL DEFAULT false,
    "assigned_at" TIMESTAMP(3),

    CONSTRAINT "tracking_number_pools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parcels" (
    "id" SERIAL NOT NULL,
    "tracking_number" VARCHAR(50) NOT NULL,
    "external_order_id" TEXT NOT NULL,
    "weight_grams" INTEGER NOT NULL,
    "length_cm" INTEGER,
    "height_cm" INTEGER,
    "width_cm" INTEGER,
    "declared_value" DECIMAL(10,2) NOT NULL,
    "origin_facility_id" INTEGER NOT NULL,
    "destination_facility_id" INTEGER NOT NULL,
    "current_facility_id" INTEGER,
    "sorting_code_cache" VARCHAR(50) NOT NULL,
    "routing_pipeline_cache" TEXT NOT NULL,
    "store_id" INTEGER NOT NULL,
    "customer_name" TEXT NOT NULL,
    "customer_address" TEXT NOT NULL,
    "customer_phone" TEXT NOT NULL,
    "customer_location" geometry(Point, 4326),
    "assigned_courier_id" INTEGER,
    "status" "shipment_status" NOT NULL DEFAULT 'pending_pickup',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parcels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stores" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "contact_number" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "location" geometry(Point, 4326),

    CONSTRAINT "stores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tracking_logs" (
    "id" SERIAL NOT NULL,
    "parcel_id" INTEGER NOT NULL,
    "status" "shipment_status" NOT NULL,
    "description" TEXT NOT NULL,
    "facility_id" INTEGER,
    "courier_id" INTEGER,

    CONSTRAINT "tracking_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "facilities_sorting_code_key" ON "facilities"("sorting_code");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "couriers_user_id_key" ON "couriers"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "couriers_phone_number_key" ON "couriers"("phone_number");

-- CreateIndex
CREATE UNIQUE INDEX "couriers_plate_number_key" ON "couriers"("plate_number");

-- CreateIndex
CREATE UNIQUE INDEX "clients_name_key" ON "clients"("name");

-- CreateIndex
CREATE UNIQUE INDEX "clients_api_key_key" ON "clients"("api_key");

-- CreateIndex
CREATE UNIQUE INDEX "tracking_number_pools_tracking_number_key" ON "tracking_number_pools"("tracking_number");

-- CreateIndex
CREATE UNIQUE INDEX "parcels_tracking_number_key" ON "parcels"("tracking_number");

-- CreateIndex
CREATE UNIQUE INDEX "parcels_external_order_id_key" ON "parcels"("external_order_id");

-- AddForeignKey
ALTER TABLE "facilities" ADD CONSTRAINT "facilities_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "facilities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_boundaries" ADD CONSTRAINT "delivery_boundaries_facility_id_fkey" FOREIGN KEY ("facility_id") REFERENCES "facilities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "couriers" ADD CONSTRAINT "couriers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "couriers" ADD CONSTRAINT "couriers_current_facility_id_fkey" FOREIGN KEY ("current_facility_id") REFERENCES "facilities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tracking_number_pools" ADD CONSTRAINT "tracking_number_pools_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parcels" ADD CONSTRAINT "parcels_tracking_number_fkey" FOREIGN KEY ("tracking_number") REFERENCES "tracking_number_pools"("tracking_number") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parcels" ADD CONSTRAINT "parcels_origin_facility_id_fkey" FOREIGN KEY ("origin_facility_id") REFERENCES "facilities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parcels" ADD CONSTRAINT "parcels_destination_facility_id_fkey" FOREIGN KEY ("destination_facility_id") REFERENCES "facilities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parcels" ADD CONSTRAINT "parcels_current_facility_id_fkey" FOREIGN KEY ("current_facility_id") REFERENCES "facilities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parcels" ADD CONSTRAINT "parcels_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parcels" ADD CONSTRAINT "parcels_assigned_courier_id_fkey" FOREIGN KEY ("assigned_courier_id") REFERENCES "couriers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tracking_logs" ADD CONSTRAINT "tracking_logs_parcel_id_fkey" FOREIGN KEY ("parcel_id") REFERENCES "parcels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tracking_logs" ADD CONSTRAINT "tracking_logs_facility_id_fkey" FOREIGN KEY ("facility_id") REFERENCES "facilities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tracking_logs" ADD CONSTRAINT "tracking_logs_courier_id_fkey" FOREIGN KEY ("courier_id") REFERENCES "couriers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
