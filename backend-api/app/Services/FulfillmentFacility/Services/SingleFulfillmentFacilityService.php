<?php

namespace App\Services\FulfillmentFacility\Services;

use App\Models\OrderPackageItem;
use App\Services\FulfillmentFacility\FulfillmentFacilityInterface;
use Illuminate\Support\Facades\DB;
use Override;

class SingleFulfillmentFacilityService implements FulfillmentFacilityInterface
{
    #[Override]
    public function execute(OrderPackageItem $orderPackageitem)
    {
        DB::transaction(function () use ($orderPackageitem) {
            $orderPackageitem->facility->reserveStock($orderPackageitem->ordered_quantity);

            $orderPackageitem->orderPackageItemFacilities()->create([
                'facility_id' => $orderPackageitem->facility->id
            ]);
        });

        return 'Single fulfillment... ';
    }
}