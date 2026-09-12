<?php

namespace App\Services\FulfillmentFacility;

use App\Models\OrderPackageItem;
use App\Services\FulfillmentFacility\Services\MultiFulfillmentFacilityService;
use App\Services\FulfillmentFacility\Services\SingleFulfillmentFacilityService;

class FulfillmentFacilityFactory
{
    public function make(OrderPackageItem $orderPackageItem): FulfillmentFacilityInterface
    {
        $variant = $orderPackageItem->variant;
        $fulfillmentFacilities = $variant->inventoryStocks;

        $partialFacilities = [];
        $quantity = $orderPackageItem->ordered_quantity;

        foreach ($fulfillmentFacilities as $facility) {
            $status = FulfillmentFacilityStatus::stockStatus($orderPackageItem->ordered_quantity, $facility->quantity_available);

            if ($status === FulfillmentFacilityStatus::Fulfill) {
                $orderPackageItem->facility = $facility;
                $partialFacilities = [];

                break;
            }

            if ($status === FulfillmentFacilityStatus::Partial) {
                if ($quantity <= 0) {
                    $orderPackageItem->facilities = $partialFacilities;

                    break;
                }

                $partialFacilities[$facility->id] = [
                    'running_quantity' => $quantity,
                    'allocated_quantity' => ($quantity >= $facility->quantity_available) ? $facility->quantity_available : $quantity,
                ];

                $partialFacilities[$facility->id] = array_merge(
                    $partialFacilities[$facility->id],
                    [
                        'quantity_to_fulfill' => $partialFacilities[$facility->id]['running_quantity'] - $partialFacilities[$facility->id]['allocated_quantity']
                    ],
                );

                $quantity = $quantity - $facility->quantity_available;
            }

        }

        // TODO: FINALIZE THIS TODAY SO WE CAN PROCEED TO THE ARRANGE-SHIPMENT AND WORK ON FOR THE FASTIFY API!! WE NEED TO MOVE FAST SO WE CAN BUILD AND STUDY GO

        // For the last facility
        if ($quantity <= 0) {
            $orderPackageItem->facilities = $partialFacilities;
        }

        if (! empty($partialFacilities)) {
            return app(MultiFulfillmentFacilityService::class);
        }

        return app(SingleFulfillmentFacilityService::class);
    }
}