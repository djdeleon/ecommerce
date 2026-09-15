-- CreateEnum
CREATE TYPE "network_type" AS ENUM ('sorting_hub', 'distribution_center', 'branch');

-- CreateEnum
CREATE TYPE "courier_status" AS ENUM ('available', 'busy', 'offline');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('admin', 'courier');

-- CreateEnum
CREATE TYPE "shipment_status" AS ENUM ('pending_pickup', 'ready_for_pickup', 'picked_up', 'in_transit', 'arrived_at_hub', 'out_for_delivery', 'delivered', 'failed_delivery', 'rejected');

-- CreateTable
CREATE TABLE "networks" (
    "id" SMALLSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "type" "network_type" NOT NULL,
    "address" TEXT NOT NULL,
    "latitude" DECIMAL(10,8) NOT NULL,
    "longitude" DECIMAL(11,8) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "networks_pkey" PRIMARY KEY ("id")
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
    "current_network_id" SMALLINT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "couriers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipments" (
    "id" SERIAL NOT NULL,
    "tracking_number" VARCHAR(100) NOT NULL,
    "external_order_id" TEXT NOT NULL,
    "provider_name" VARCHAR(50) NOT NULL,
    "sender_name" TEXT NOT NULL,
    "sender_phone_number" VARCHAR(20) NOT NULL,
    "sender_address" TEXT NOT NULL,
    "recipient_name" TEXT NOT NULL,
    "recipient_phone_number" VARCHAR(20) NOT NULL,
    "recipient_address" TEXT NOT NULL,
    "recipient_latitude" DECIMAL(10,8) NOT NULL,
    "recipient_longitude" DECIMAL(11,8) NOT NULL,
    "weight_kg" DECIMAL(5,2) NOT NULL,
    "status" "shipment_status" NOT NULL DEFAULT 'pending_pickup',
    "current_network_id" SMALLINT,
    "assigned_courier_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shipments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tracking_logs" (
    "id" SERIAL NOT NULL,
    "shipment_id" INTEGER NOT NULL,
    "status" "shipment_status" NOT NULL,
    "description" TEXT NOT NULL,
    "network_id" SMALLINT,
    "courier_id" INTEGER,

    CONSTRAINT "tracking_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "networks_code_key" ON "networks"("code");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "couriers_user_id_key" ON "couriers"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "couriers_phone_number_key" ON "couriers"("phone_number");

-- CreateIndex
CREATE UNIQUE INDEX "couriers_plate_number_key" ON "couriers"("plate_number");

-- CreateIndex
CREATE UNIQUE INDEX "shipments_tracking_number_key" ON "shipments"("tracking_number");

-- AddForeignKey
ALTER TABLE "couriers" ADD CONSTRAINT "couriers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "couriers" ADD CONSTRAINT "couriers_current_network_id_fkey" FOREIGN KEY ("current_network_id") REFERENCES "networks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_current_network_id_fkey" FOREIGN KEY ("current_network_id") REFERENCES "networks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_assigned_courier_id_fkey" FOREIGN KEY ("assigned_courier_id") REFERENCES "couriers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tracking_logs" ADD CONSTRAINT "tracking_logs_shipment_id_fkey" FOREIGN KEY ("shipment_id") REFERENCES "shipments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tracking_logs" ADD CONSTRAINT "tracking_logs_network_id_fkey" FOREIGN KEY ("network_id") REFERENCES "networks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tracking_logs" ADD CONSTRAINT "tracking_logs_courier_id_fkey" FOREIGN KEY ("courier_id") REFERENCES "couriers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
