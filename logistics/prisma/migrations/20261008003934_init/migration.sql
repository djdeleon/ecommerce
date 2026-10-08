CREATE EXTENSION IF NOT EXISTS postgis;

-- CreateEnum
CREATE TYPE "facility_type" AS ENUM ('mega_gateway', 'distribution_center', 'local_branch');

-- CreateEnum
CREATE TYPE "courier_status" AS ENUM ('available', 'busy', 'offline');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('admin', 'courier');

-- CreateEnum
CREATE TYPE "shipment_status" AS ENUM ('pending_pickup', 'ready_for_pickup', 'picked_up', 'arrived_at_origin_hub', 'sorting', 'bagged', 'arrived_at_destination_hub', 'in_transit', 'arrived_at_hub', 'out_for_delivery', 'delivered', 'failed_delivery', 'rejected');

-- CreateEnum
CREATE TYPE "shipping_service_type" AS ENUM ('regular', 'express', 'bulky');

-- CreateEnum
CREATE TYPE "transit_mode" AS ENUM ('land_shuttle', 'highway_linehaul', 'maritime_roro', 'air_freight');

-- CreateEnum
CREATE TYPE "VehicleType" AS ENUM ('van', 'truck', 'motorcycle');

-- CreateEnum
CREATE TYPE "MasterBagStatus" AS ENUM ('open', 'sealed', 'dispatched', 'delivered');

-- CreateEnum
CREATE TYPE "SortingType" AS ENUM ('manual', 'automated');

-- CreateEnum
CREATE TYPE "SortationBatchStatus" AS ENUM ('scheduled', 'active', 'completed', 'cancelled');

-- CreateTable
CREATE TABLE "regions" (
    "id" VARCHAR(15) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(15) NOT NULL,

    CONSTRAINT "regions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provinces" (
    "id" VARCHAR(15) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(15) NOT NULL,
    "region_id" TEXT NOT NULL,

    CONSTRAINT "provinces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cities" (
    "id" VARCHAR(15) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(15) NOT NULL,
    "province_id" TEXT,

    CONSTRAINT "cities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sectors" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(15) NOT NULL,
    "zone" geometry(Polygon, 4326),
    "local_branch_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sectors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "barangays" (
    "id" VARCHAR(15) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(15) NOT NULL,
    "city_id" TEXT NOT NULL,
    "sector_id" INTEGER,

    CONSTRAINT "barangays_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "facilities" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(15) NOT NULL,
    "address" TEXT NOT NULL,
    "location" geometry(Point, 4326),
    "type" "facility_type" NOT NULL,
    "parent_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "facilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "facility_operations" (
    "id" SERIAL NOT NULL,
    "facility_id" INTEGER NOT NULL,
    "sorting_type" "SortingType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "facility_operations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "facility_schedules" (
    "id" SERIAL NOT NULL,
    "facility_id" INTEGER NOT NULL,
    "opening_time" TIME NOT NULL,
    "closing_time" TIME NOT NULL,
    "cut_off_time" TIME NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "facility_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "network_legs" (
    "id" SERIAL NOT NULL,
    "source_facility_id" INTEGER NOT NULL,
    "destination_facility_id" INTEGER NOT NULL,
    "lane_code" VARCHAR(20) NOT NULL,
    "route" geometry(LineString, 4326) NOT NULL,
    "distance_km" INTEGER NOT NULL,
    "vehicle_profile" TEXT NOT NULL,
    "base_transit_duration" INTEGER NOT NULL,
    "mode" "transit_mode" NOT NULL,
    "cut_off_time" TIME NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "network_legs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "facility_chutes" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "facility_id" INTEGER NOT NULL,
    "destination_facility_id" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "facility_chutes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courier_schedules" (
    "id" SERIAL NOT NULL,
    "courier_id" INTEGER,
    "physical_vehicle_id" INTEGER NOT NULL,
    "network_leg_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "courier_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dispatch_logs" (
    "id" SERIAL NOT NULL,
    "assigned_courier_id" INTEGER NOT NULL,
    "origin_facility_id" INTEGER,
    "dispatched_at" TIMESTAMP(3) NOT NULL,
    "arrived_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dispatch_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sortation_batches" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "start_time" TIMESTAMP(3),
    "end_time" TIMESTAMP(3),
    "facility_id" INTEGER NOT NULL,
    "status" "SortationBatchStatus" NOT NULL DEFAULT 'scheduled',
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sortation_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "master_bags" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "courier_schedule_id" INTEGER NOT NULL,
    "sorting_batch_id" INTEGER NOT NULL,
    "facility_chute_id" INTEGER,
    "current_facility_id" INTEGER NOT NULL,
    "next_facility_id" INTEGER NOT NULL,
    "total_weight" INTEGER NOT NULL,
    "total_parcels" INTEGER NOT NULL,
    "status" "MasterBagStatus" NOT NULL DEFAULT 'open',
    "sealed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "master_bags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sector_couriers" (
    "id" SERIAL NOT NULL,
    "sector_id" INTEGER NOT NULL,
    "courier_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sector_couriers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'courier',

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "couriers" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "phone_number" VARCHAR(20) NOT NULL,
    "vehicle_type" VARCHAR(50) NOT NULL,
    "plate_number" VARCHAR(20) NOT NULL,
    "status" "courier_status" NOT NULL,
    "assigned_facility_id" INTEGER NOT NULL,
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
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tracking_number_pools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parcels" (
    "id" SERIAL NOT NULL,
    "tracking_number" VARCHAR(50) NOT NULL,
    "external_order_id" TEXT NOT NULL,
    "weight_grams" INTEGER NOT NULL,
    "length_cm" DOUBLE PRECISION,
    "height_cm" DOUBLE PRECISION,
    "width_cm" DOUBLE PRECISION,
    "declared_value" DECIMAL(10,2) NOT NULL,
    "shipping_service_type" "shipping_service_type" NOT NULL DEFAULT 'regular',
    "origin_facility_id" INTEGER,
    "destination_facility_id" INTEGER,
    "current_facility_id" INTEGER,
    "sorting_code_cache" VARCHAR(50) NOT NULL,
    "routing_pipeline_cache" TEXT NOT NULL,
    "store_id" INTEGER NOT NULL,
    "customer_name" TEXT NOT NULL,
    "customer_phone" TEXT NOT NULL,
    "customer_address" TEXT NOT NULL,
    "customer_location" geometry(Point, 4326),
    "assigned_courier_id" INTEGER,
    "status" "shipment_status" NOT NULL DEFAULT 'pending_pickup',
    "master_bag_id" INTEGER,
    "sortation_batch_id" INTEGER,
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
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

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
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tracking_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_profiles" (
    "id" SERIAL NOT NULL,
    "brand" VARCHAR(50) NOT NULL,
    "model_name" VARCHAR(50) NOT NULL,
    "variant" VARCHAR(50) NOT NULL,
    "max_weight_capacity_g" INTEGER NOT NULL,
    "max_usable_volume_cbm" DOUBLE PRECISION NOT NULL,
    "allocation_volume_target" DOUBLE PRECISION NOT NULL,
    "length_mm" INTEGER NOT NULL,
    "width_mm" INTEGER NOT NULL,
    "height_mm" INTEGER NOT NULL,
    "type" "VehicleType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicle_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "physical_vehicles" (
    "id" SERIAL NOT NULL,
    "vehicle_profile_id" INTEGER NOT NULL,
    "assigned_facility_id" INTEGER NOT NULL,
    "plate_number" TEXT NOT NULL,
    "gps" geometry(Point, 4326) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "physical_vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "facility_operations_facility_id_key" ON "facility_operations"("facility_id");

-- CreateIndex
CREATE UNIQUE INDEX "facility_schedules_facility_id_key" ON "facility_schedules"("facility_id");

-- CreateIndex
CREATE UNIQUE INDEX "master_bags_code_key" ON "master_bags"("code");

-- CreateIndex
CREATE UNIQUE INDEX "sector_couriers_sector_id_courier_id_key" ON "sector_couriers"("sector_id", "courier_id");

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

-- CreateIndex
CREATE UNIQUE INDEX "stores_name_key" ON "stores"("name");

-- CreateIndex
CREATE UNIQUE INDEX "physical_vehicles_plate_number_key" ON "physical_vehicles"("plate_number");

-- AddForeignKey
ALTER TABLE "provinces" ADD CONSTRAINT "provinces_region_id_fkey" FOREIGN KEY ("region_id") REFERENCES "regions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cities" ADD CONSTRAINT "cities_province_id_fkey" FOREIGN KEY ("province_id") REFERENCES "provinces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sectors" ADD CONSTRAINT "sectors_local_branch_id_fkey" FOREIGN KEY ("local_branch_id") REFERENCES "facilities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "barangays" ADD CONSTRAINT "barangays_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "barangays" ADD CONSTRAINT "barangays_sector_id_fkey" FOREIGN KEY ("sector_id") REFERENCES "sectors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facilities" ADD CONSTRAINT "facilities_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "facilities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facility_operations" ADD CONSTRAINT "facility_operations_facility_id_fkey" FOREIGN KEY ("facility_id") REFERENCES "facilities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facility_schedules" ADD CONSTRAINT "facility_schedules_facility_id_fkey" FOREIGN KEY ("facility_id") REFERENCES "facilities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "network_legs" ADD CONSTRAINT "network_legs_source_facility_id_fkey" FOREIGN KEY ("source_facility_id") REFERENCES "facilities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "network_legs" ADD CONSTRAINT "network_legs_destination_facility_id_fkey" FOREIGN KEY ("destination_facility_id") REFERENCES "facilities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facility_chutes" ADD CONSTRAINT "facility_chutes_facility_id_fkey" FOREIGN KEY ("facility_id") REFERENCES "facilities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facility_chutes" ADD CONSTRAINT "facility_chutes_destination_facility_id_fkey" FOREIGN KEY ("destination_facility_id") REFERENCES "facilities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courier_schedules" ADD CONSTRAINT "courier_schedules_courier_id_fkey" FOREIGN KEY ("courier_id") REFERENCES "couriers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courier_schedules" ADD CONSTRAINT "courier_schedules_physical_vehicle_id_fkey" FOREIGN KEY ("physical_vehicle_id") REFERENCES "physical_vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courier_schedules" ADD CONSTRAINT "courier_schedules_network_leg_id_fkey" FOREIGN KEY ("network_leg_id") REFERENCES "network_legs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispatch_logs" ADD CONSTRAINT "dispatch_logs_assigned_courier_id_fkey" FOREIGN KEY ("assigned_courier_id") REFERENCES "couriers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispatch_logs" ADD CONSTRAINT "dispatch_logs_origin_facility_id_fkey" FOREIGN KEY ("origin_facility_id") REFERENCES "facilities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sortation_batches" ADD CONSTRAINT "sortation_batches_facility_id_fkey" FOREIGN KEY ("facility_id") REFERENCES "facilities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "master_bags" ADD CONSTRAINT "master_bags_courier_schedule_id_fkey" FOREIGN KEY ("courier_schedule_id") REFERENCES "courier_schedules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "master_bags" ADD CONSTRAINT "master_bags_sorting_batch_id_fkey" FOREIGN KEY ("sorting_batch_id") REFERENCES "sortation_batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "master_bags" ADD CONSTRAINT "master_bags_facility_chute_id_fkey" FOREIGN KEY ("facility_chute_id") REFERENCES "facility_chutes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "master_bags" ADD CONSTRAINT "master_bags_current_facility_id_fkey" FOREIGN KEY ("current_facility_id") REFERENCES "facilities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "master_bags" ADD CONSTRAINT "master_bags_next_facility_id_fkey" FOREIGN KEY ("next_facility_id") REFERENCES "facilities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sector_couriers" ADD CONSTRAINT "sector_couriers_sector_id_fkey" FOREIGN KEY ("sector_id") REFERENCES "sectors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sector_couriers" ADD CONSTRAINT "sector_couriers_courier_id_fkey" FOREIGN KEY ("courier_id") REFERENCES "couriers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "couriers" ADD CONSTRAINT "couriers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "couriers" ADD CONSTRAINT "couriers_assigned_facility_id_fkey" FOREIGN KEY ("assigned_facility_id") REFERENCES "facilities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

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
ALTER TABLE "parcels" ADD CONSTRAINT "parcels_master_bag_id_fkey" FOREIGN KEY ("master_bag_id") REFERENCES "master_bags"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parcels" ADD CONSTRAINT "parcels_sortation_batch_id_fkey" FOREIGN KEY ("sortation_batch_id") REFERENCES "sortation_batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tracking_logs" ADD CONSTRAINT "tracking_logs_parcel_id_fkey" FOREIGN KEY ("parcel_id") REFERENCES "parcels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tracking_logs" ADD CONSTRAINT "tracking_logs_facility_id_fkey" FOREIGN KEY ("facility_id") REFERENCES "facilities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tracking_logs" ADD CONSTRAINT "tracking_logs_courier_id_fkey" FOREIGN KEY ("courier_id") REFERENCES "couriers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "physical_vehicles" ADD CONSTRAINT "physical_vehicles_vehicle_profile_id_fkey" FOREIGN KEY ("vehicle_profile_id") REFERENCES "vehicle_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "physical_vehicles" ADD CONSTRAINT "physical_vehicles_assigned_facility_id_fkey" FOREIGN KEY ("assigned_facility_id") REFERENCES "facilities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
