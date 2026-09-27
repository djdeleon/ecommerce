import { Coordinates } from "#commons/types.js";
import { generateSortingCodes } from "#commons/utils/sorting-engine.js";
import { createStore } from "../stores/service.js";
import { PrismaClient } from "@prisma/client/extension";
import { prisma as db } from "#commons/database/prisma.js";
import { activateTrackingNumber } from "../tracking-numbers/service.js";

export interface StructuredAddress {
  region: string;
  province: string;
  city: string;
  barangay: string;
  full_address: string;
  coordinates: Coordinates;
}

interface MerchantDetails {
  name: string;
  contact_number: string;
  pickup_address: StructuredAddress;
}

export interface CustomerDetails {
  name: string;
  contact_number: string;
  email: string;
  delivery_address: StructuredAddress;
}

export interface ParcelInfo {
  weight_grams: number;
  length_cm: number;
  width_cm: number;
  height_cm: number;
  item_description: string;
  declared_value: number;
}

export interface OrderInfo {
  order_id: string;
  tracking_number: string;
  service_type: string;
  payment_method: string;
  cod_amount: number;
  currency: string;
}

export interface CreateParcelData {
  merchant_details: MerchantDetails;
  customer_details: CustomerDetails;
  parcel_info: ParcelInfo;
  order_info: OrderInfo;
}

export async function createParcel(prisma: PrismaClient, data: CreateParcelData) {
  const { merchant_details, order_info, parcel_info, customer_details } = data
  const merchantLng = merchant_details.pickup_address.coordinates.longitude
  const merchantLat = merchant_details.pickup_address.coordinates.latitude
  const customerLng = customer_details.delivery_address.coordinates.longitude
  const customerLat = customer_details.delivery_address.coordinates.latitude
  const randomSuffix = Math.floor(Math.random() * 10000);

  const [closestOriginHub] = await prisma.$queryRaw<any[]>`
    SELECT id FROM "facilities" 
    ORDER BY location <-> ST_SetSRID(ST_MakePoint(${merchantLng}, ${merchantLat}), 4326) 
    LIMIT 1;
  `;

  console.log(closestOriginHub)

  console.log({
    'Merchant Coordinates': {
      merchantLng,
      merchantLat
    }
  })

  const [closestDestinationHub] = await prisma.$queryRaw<any[]>`
    SELECT id FROM "facilities" 
    ORDER BY location <-> ST_SetSRID(ST_MakePoint(${customerLng}, ${customerLat}), 4326) 
    LIMIT 1;
  `;

  console.log(closestDestinationHub)

  const { province, city, barangay } = customer_details.delivery_address;

  const { sortingCodeCache, routingPipelineCache } = generateSortingCodes(province, city, barangay)
  const storeName = `${merchant_details.name} ${randomSuffix}`

  const [store] = await createStore(prisma, {
    name: storeName,
    contactNumber: merchant_details.contact_number,
    address: merchant_details.pickup_address.full_address,
    coordinates: {
      longitude: merchantLng,
      latitude: merchantLat,
    }
  })

  console.log(store)

  const [parcel] = await prisma.$queryRaw<any[]>`
    INSERT INTO "parcels" (
      "tracking_number",
      "external_order_id",
      "weight_grams",
      "length_cm",
      "height_cm",
      "width_cm",
      "declared_value",
      "origin_facility_id",
      "destination_facility_id",
      "sorting_code_cache",
      "routing_pipeline_cache",
      "store_id",
      "customer_name",
      "customer_phone",
      "customer_address",
      "customer_location",
      "updated_at"
    ) VALUES (
      ${order_info.tracking_number},
      ${order_info.order_id},
      ${parcel_info.weight_grams},
      ${parcel_info.length_cm},
      ${parcel_info.height_cm},
      ${parcel_info.width_cm},
      ${parcel_info.declared_value},
      ${closestOriginHub.id},
      ${closestDestinationHub.id},
      ${sortingCodeCache},
      ${routingPipelineCache},
      ${store.id},
      ${customer_details.name},
      ${customer_details.contact_number},
      ${customer_details.delivery_address.full_address},
      ST_SetSRID(ST_MakePoint(${parseFloat(customerLng)}, ${parseFloat(customerLat)}), 4326),
      NOW()
    )
    RETURNING *;
  `

  return parcel
}