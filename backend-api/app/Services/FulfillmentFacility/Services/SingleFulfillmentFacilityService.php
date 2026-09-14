<?php

namespace App\Services\FulfillmentFacility\Services;

use App\Models\OrderPackageItem;
use App\Services\FulfillmentFacility\FulfillmentFacilityInterface;
use Illuminate\Support\Facades\DB;
use Override;

class SingleFulfillmentFacilityService implements FulfillmentFacilityInterface
{
    #[Override]
    public function execute(OrderPackageItem $orderPackageItem)
    {
        DB::transaction(function () use ($orderPackageItem) {
            $orderPackageItem->facility->reserveStock($orderPackageItem->ordered_quantity);

            $orderPackageItem->orderPackageItemFacilities()->create([
                'facility_id' => $orderPackageItem->facility->id
            ]);

            unset($orderPackageItem->facility);
        });

        return 'Single fulfillment... ';
    }
}