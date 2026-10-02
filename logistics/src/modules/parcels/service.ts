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

  console.dir({
    merchantLng,
    merchantLat
  })

  const [closestOriginHub] = await prisma.$queryRaw<any[]>`
    SELECT id, name, parent_id FROM "facilities" 
    ORDER BY location <-> ST_SetSRID(ST_MakePoint(${merchantLng}, ${merchantLat}), 4326) 
    LIMIT 1;
  `;

  console.log({ 'closestOriginHub': closestOriginHub })

  console.dir({
    customerLng,
    customerLat
  })

  const [closestDestinationHub] = await prisma.$queryRaw<any[]>`
    SELECT id, name, parent_id FROM "facilities" 
    ORDER BY location <-> ST_SetSRID(ST_MakePoint(${customerLng}, ${customerLat}), 4326) 
    LIMIT 1;
  `;

  console.log({ 'closestDestinationHub': closestDestinationHub })

  /**
   * I think I now need to handle the Trucks and their assigned routes
   * 
   * Now let's make the parcel arrival at the origin local branch a big deal, this way we can simulate the schedule of the 4 wheeler truck to the nearest gateway for the midmile
   */

  console.log(closestDestinationHub)

  const ancestry: any[] = await prisma.$queryRaw`
    WITH RECURSIVE facility_tree AS (
      SELECT id, name, parent_id, type, sorting_code, 1 as level
      FROM facilities
      WHERE id = ${closestOriginHub.id}

      UNION ALL

      SELECT f.id, f.name, f.parent_id, f.type, f.sorting_code, ft.level + 1
      FROM facilities f
      INNER JOIN facility_tree ft ON f.id = ft.parent_id
    )
    
    SELECT id, name, type, sorting_code, level FROM facility_tree ORDER BY level ASC;
  `;

  console.log({
    ancestry
  })

  const routingPipelineCache = ancestry.map(node => node.name).join(' ➔  ')
  const sortingCodeCache = ancestry.map(node => node.sorting_code).join('-')

  console.log({
    routingPipelineCache,
    sortingCodeCache
  })

  // const { province, city, barangay } = customer_details.delivery_address;
  // const { sortingCodeCache, routingPipelineCache } = generateSortingCodes(province, city, barangay)

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