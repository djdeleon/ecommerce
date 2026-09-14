<?php

namespace App\Services;

use App\DataObjects\Coordinate;
use App\Models\CartItem;
use App\Services\Logistic\Drivers\JntExpressDriver;
use Illuminate\Support\Collection;

class CartService
{
    public function __construct(
        protected GeolocationService $geolocationService,
        protected JntExpressDriver $jntExpressDriver,
        protected LogisiticService $logisticService,
    ) {}

    public function calculateItems(Collection $transformedVendorItems, string $customerZone)
    {
        return $transformedVendorItems->map(function ($items) use ($customerZone) {
            $items['items'] = $items['items']->map(function ($item) use ($customerZone) {
                /**
                 * Nearest Hub
                 */
                $nearestHub = $item['inventory_stocks']->sortBy('hub.distance_km')->first();
                $item['nearest_hub'] = $nearestHub;

                /**
                 * Unset inventory_stocks not needed anymore
                 */
                // unset($item['inventory_stocks']);

                /**
                 * Calculate Shipping Fee for the nearest hub with Actual and Volumetric Weight
                 */
                /**
                 * Getting the Weight
                 * It needs to be multiplied by quantity
                 */
                $actualWeight = 2;
                $volumetricWeight = $this->jntExpressDriver->volumetricWeight(20, 20, 30);

                $weight = max($actualWeight, $volumetricWeight);

                $weightByQuantity = $weight * $item['quantity'];

                $hubZone = $item['nearest_hub']['hub']['zone'];

                $shippingFee = $this->logisticService->calculateShippingFee($customerZone, $hubZone, $weightByQuantity);

                $item['shipping_fee_details'] = $shippingFee;

                $item['subtotal'] = bcadd($shippingFee['shippingFee'], $item['price_quantity'], 4);

                return $item;
            })->values();

            $items['merchant_total'] = $items['items']->sum('subtotal');

            return $items;
        })->values();
    }

    public function mapForCheckout(Collection $vendorItems, Coordinate $customerCoords)
    {
        return $vendorItems->map(function ($groups) use ($customerCoords) {
            $vendor = $groups[0]->variant->product->vendor;

            // $vendor->getNearbyFacilities($customerZone)
            // and the way we gonna show the products on the homepage is by customer's zone
            // - we gonna aggregate the totality of the quantity across all vendor facilities by customer's selected shipping address' zone
            // - - this means that the Multi-Facility Fulfillment is going to really happen.
            // - - - so we have SingleFacilityFulfillmentStrategy and MultiFacilityFulfillmentStrategy
            // - - - - This is enough for now, let's make this a Strategy Pattern and not entertain another feature for now. we need to build the base.
            // the Factory needs to get the order quantity, but the question remains unanswered. 
            // each item into vendor facilites OR all items into all vendor facilities
            // - you need to be able to answer this for the factory to hand you the right strategy. 
            // - - but we still have another question to answer. Can a certain facility be able to fulfill the entire items?
            // - - - this is the question for SingleFacility
            // - - - - this means the factory needs the entire items for it to be able to answer this question.
            // - - - - - this means the factory needs to know the order items, and vendor facilities within the zone.
            // - - - - - - fetching the vendor zone facilities is one time.
            // - - - - - - - and we gonna loop the order items and within that loop the vendor zone facilites.
            // - - - - - - - we are simply just going to check, if it is true then use SingleFacility
            // - - - - - - - - and inside of this... I don't think we need factory for this, because if the check is true, we can directly instantiate and call the SingleFacility
            // - - - - - - - - - I think we need Pipeline called FulfillmentFacilityPipeline.
            // - - - - -  - -- lets build a matrix even it is in the Single Facility
            // dd($groups->toArray());

            // how about the fulfillment hub
            // i am now having a hard time to think if I am going to fetch the facilities by each variant or by vendor->getFacilities()
            // - if every variants, one thing this is good is when a variant only exist in one facility.
            // - -for example 2 items, item_1 is stocked in facility A but item_2 is stocked to all facilities 10^2
            // - - cos this is what's gonna happen in variant[0].
            // - - - variant[0]->sortInStockFacilitiesByNearest()
            // - - - - notice that we are just classifying the facility InStock because we don't care about the facility that has 0 quantity_available.
            // dd($vendor->warehouses->count());


            /**
             * The total stocks of a variant is displayed on the shopping page,
             * - this means the variant stock is aggregated.
             * - the variant quantity is displayed based on which island/zone the customer shipping address is located
             * - - this will affect how we find the fulfillment facility of a variant.
             * - - so instead of unconditionally getting all the inventoryStocks in the 'inventory_stocks' key below, we can get the inventoryStocksZone
             * - - - instead of $variant[0]->inventoryStocks, we do $variant[0]->inventoryStocksZone.
             * - - - 
             */
            return [
                'vendor_id' => $vendor->id,
                'shop_name' => $vendor->shop_name,
                'items' => $groups->map(function ($group) use ($customerCoords) {
                    $price = bcdiv($group->variant->price->getAmount(), 10000, 4); 
                    $quantity = $group->quantity;

                    return [
                        'variant' => [
                            'id' => $group->variant_id,
                            'sku' => $group->variant->sku,
                            'price' => $price,
                            'actual_weight_kg' => $group->variant->actual_weight_kg,
                        ],
                        'product' => [
                            'id' => $group->variant->product->id,
                            'name' => $group->variant->product->name,
                            'slug' => $group->variant->product->slug,
                            'description' => $group->variant->product->description,
                        ],
                        /**
                         * We can do this fetching of inventoryStocks in SQL
                         * - get the inventory record of a variant that are close to the customer shipping and retrieve the 1st one.
                         */

                        /**
                         * We should not doing this in checkout, we only do this to get the shipping fee
                         * BUT when the customer clicks 'place order' that is the time where we have to identify the FacilityFulfillment
                         */
                        'inventory_stocks' => $group->variant->inventoryStocks
                                                ->filter(function ($stock) use ($quantity) {
                                                    return $quantity <= $stock->quantity_available;
                                                })->map(function ($stock) use ($customerCoords) {
                                                    return [
                                                        'stock_id' => $stock->id,
                                                        'quantity_available' => $stock->quantity_available,
                                                        'hub' => [
                                                            'name' => $stock->inventorable->name,
                                                            'coordinates' => $stock->inventorable->coordinates(),
                                                            'distance_km' => $this->geolocationService->calculateHaversineDistance(
                                                                $customerCoords->lat,
                                                                $customerCoords->lon,
                                                                $stock->inventorable->coordinates()->lat,
                                                                $stock->inventorable->coordinates()->lon
                                                            ),
                                                            'zone' => $stock->inventorable->address->region->zone
                                                        ]
                                                    ];
                                                })
                                                ->values(),
                        'quantity' => $quantity,
                        'price_quantity' => bcmul($price, $quantity, 4),
                    ];
                })
            ];
        });
    }

    public function getCartItemsByVendor(array $ids)
    {
        return $this->getCartItemsByIds($ids)->groupBy(fn ($item) => $item->variant->product->vendor->id);
    }

    public function getCartItemsByIds(array $ids)
    {
        return CartItem::whereIn('id', $ids)->with(['variant.product.vendor', 'variant.inventoryStocks.inventorable.address.region'])->get();
    }
}