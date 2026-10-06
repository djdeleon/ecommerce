import { Coordinates } from "#commons/types.js";
import { generateSortingCodes } from "#commons/utils/sorting-engine.js";
import { createStore } from "../stores/service.js";
import { PrismaClient } from "@prisma/client/extension";
import { prisma as db } from "#commons/database/prisma.js";
import { activateTrackingNumber } from "../tracking-numbers/service.js";
import { FacilityType } from "@prisma/client";

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

  // console.dir({
  //   merchantLng,
  //   merchantLat
  // })

  // const [closestOriginHub] = await prisma.$queryRaw<any[]>`
  //   SELECT id, name, parent_id FROM "facilities" 
  //   ORDER BY location <-> ST_SetSRID(ST_MakePoint(${merchantLng}, ${merchantLat}), 4326) 
  //   LIMIT 1;
  // `;

  // console.log({ 'closestOriginHub': closestOriginHub })

  // console.dir({
  //   customerLng,
  //   customerLat
  // })

  // const [closestDestinationHub] = await prisma.$queryRaw<any[]>`
  //   SELECT id, name, parent_id FROM "facilities" 
  //   ORDER BY location <-> ST_SetSRID(ST_MakePoint(${customerLng}, ${customerLat}), 4326) 
  //   LIMIT 1;
  // `;

  // console.log({ 'closestDestinationHub': closestDestinationHub })

  /**
   * I think I now need to handle the Trucks and their assigned routes
   * 
   * Now let's make the parcel arrival at the origin local branch a big deal, this way we can simulate the schedule of the 4 wheeler truck to the nearest gateway for the midmile
   */

  // console.log(closestDestinationHub)

  // const ancestry: any[] = await prisma.$queryRaw`
  //   WITH RECURSIVE facility_tree AS (
  //     SELECT id, name, parent_id, type, sorting_code, 1 as level
  //     FROM facilities
  //     WHERE id = ${closestOriginHub.id}

  //     UNION ALL

  //     SELECT f.id, f.name, f.parent_id, f.type, f.sorting_code, ft.level + 1
  //     FROM facilities f
  //     INNER JOIN facility_tree ft ON f.id = ft.parent_id
  //   )

  //   SELECT id, name, type, sorting_code, level FROM facility_tree ORDER BY level ASC;
  // `;

  // console.log({
  //   ancestry
  // })

  // const routingPipelineCache = ancestry.map(node => node.name).join(' ➔  ')
  // const sortingCodeCache = ancestry.map(node => node.sorting_code).join('-')

  // console.log({
  //   routingPipelineCache,
  //   sortingCodeCache
  // })
  const [matchingSellerSector] = await prisma.$queryRaw<any[]>`
    SELECT id FROM "sectors"
    WHERE ST_Contains(
      "zone", 
      ST_SetSRID(ST_MakePoint(${merchantLng}, ${merchantLat}), 4326)
    );
  `;

  console.log(matchingSellerSector.id)

  // this sector can point to the city if you store the city code as a prefix of the sector's code, and bubble up from there
  const matchingSellerSectorData = await prisma.sector.findUniqueOrThrow({
    where: { id: matchingSellerSector.id },
    include: { localBranch: true }
  })

  const firstMileLocalBranch = matchingSellerSector.localBranch

  console.log(matchingSellerSectorData)

  const [matchingBuyerSector] = await prisma.$queryRaw<any[]>`
    SELECT id FROM "sectors"
    WHERE ST_Contains(
      "zone", 
      ST_SetSRID(ST_MakePoint(${customerLng}, ${customerLat}), 4326)
    );
  `;

  console.log(matchingBuyerSector.id)

  // this sector can point to the city if you store the city code as a prefix of the sector's code, and bubble up from there
  const matchingBuyerSectorData = await prisma.sector.findUniqueOrThrow({
    where: { id: matchingBuyerSector.id },
    include: { localBranch: true }
  })

  const lastMileLocalBranch = matchingBuyerSector.localBranch

  console.log(matchingBuyerSectorData)

  const sortingCode = matchingBuyerSectorData.code

  const sortingCodeSegments = sortingCode.split('-')
  const regKey = sortingCode.substring(0, 3)
  const provKey = sortingCode.substring(0, 7)
  const cityKey = sortingCode.substring(0, 11)
  const sectorKey = sortingCodeSegments.at(-1)

  const sellerRegKey = matchingSellerSectorData.code.substring(0, 3)
  const sellerProvKey = matchingSellerSectorData.code.substring(0, 7)
  const sellerCityKey = matchingSellerSectorData.code.substring(0, 11)
  const sellerSectorKey = matchingSellerSectorData.code.substring(0, 14)

  console.log(regKey)
  console.log(provKey)
  console.log(cityKey)
  console.log(sectorKey)
  console.log(sortingCode)

  // console.log(sellerRegKey)
  // console.log(sellerProvKey)
  // console.log(sellerCityKey)
  // console.log(sellerSectorKey)
  // console.log(matchingSellerSectorData.code)


  const megaGateway = await prisma.megaGateway.findFirstOrThrow({
    where: { coverageCode: regKey }
  })

  const distributionCenter = await prisma.distributionCenter.findFirstOrThrow({
    where: { coverageCode: provKey }
  })

  console.log(megaGateway)
  console.log(distributionCenter)
  console.log(matchingBuyerSectorData.localBranch.name)

  console.log(matchingSellerSectorData.localBranch)
  console.log(matchingBuyerSectorData.localBranch)

  let routingPipelineCache = '';

  // If IntraSector the Local Branch facility can easily handle the delivery.
  if (matchingSellerSectorData.localBranchId === matchingBuyerSectorData.localBranchId) {
    console.log('Intra-Sector Booking')
    routingPipelineCache = `${matchingSellerSectorData.localBranch.name} -> ${sectorKey}`
  }

  // If BranchToBranch (BranchNeighbor)
  // The routing pipeline shouldn't be this (NCR Sorting Gateway Clark -> Urdaneta DC -> Malinquis Delivery Hub)
  // // it's far. It should only be San Carlos Delivery Hub -> Malinquis Delivery Hub -> 01
  else if (sellerProvKey === provKey && sellerCityKey !== cityKey) {
    // if they are both located under the same province, these might happen:
    // TODO #1
    // 1. the seller's local branch is close to the DC Facility and this DC Facility is close to the buyer's local branch
    // - - seller's local branch -> DC Facility -> buyer's local branch
    // 2. seller's local branch is directly close to the buyer's local branch, no need to go to the close DC or Gateway
    // so for the two scenarios let's handle the 2 first.
    // get the closest network leg for the seller's local branch
    // // this is where we should query all the connected facilities for the seller's local branch
    console.log('here')
    console.log(matchingSellerSectorData) // code: 'R01-PAN-SNC-01' // org
    console.log(matchingBuyerSectorData) // code: 'R01-PAN-MLQ-01' // des
    const [sellerLocalBranchNearestFacility] = await prisma.networkLeg.findMany({
      where: { sourceFacilityId: matchingSellerSectorData.localBranchId },
      orderBy: {
        baseTransitDuration: 'asc'
      },
      take: 1,
    })
    // this returns the nearest facility for Seller Local Branch (MLQ) nearest Local Branch for the Buyer.
    // we do this so the parcel doesn't have to be sorted in the farther facilities.
    // this is where we can calculate the shipping estimation.
    //// this is where we should take into account the facility cutoff and the scheduled parcel feeding, and the sorting hours.

    // TODO
    // For the rider going to MLQ Branch Network Leg
    // lets say a rider goes there for twice a day.
    // - actually not a rider, let's do 4-wheeler vehicle, a car to collect parcels.
    // - the last freight should arrive 1 hour before the cutoff.
    // - - we have to take into account the parcel preparation for the vehicle, the freight, the offloading, 
    // - - - also every when a facility runs the sortation?
    console.log(sellerLocalBranchNearestFacility)
    const facilityDelegates: any = {
      [FacilityType.LocalBranch]: prisma.localBranch,
      [FacilityType.DistributionCenter]: prisma.distributionCenter,
      [FacilityType.MegaGateway]: prisma.megaGateway,
    }

    const delegate = facilityDelegates[sellerLocalBranchNearestFacility.destinationFacility];

    if (!delegate) {
      throw new Error(`Unsupported facility type: ${sellerLocalBranchNearestFacility.destinationFacility}`);
    }

    const nearestFacility = await delegate.findFirstOrThrow({
      where: { id: sellerLocalBranchNearestFacility.destinationFacilityId }
    });
    
    routingPipelineCache = `${matchingSellerSectorData.localBranch.name} -> ${nearestFacility.name} -> ${sectorKey}`
  }

  else {
    routingPipelineCache = `${megaGateway.name} -> ${distributionCenter.name} -> ${matchingBuyerSectorData.localBranch.name}`
  }


  console.log(routingPipelineCache)
  process.exit(1)

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