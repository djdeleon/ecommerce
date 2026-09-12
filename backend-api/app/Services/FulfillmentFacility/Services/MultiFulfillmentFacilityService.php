<?php

namespace App\Services\FulfillmentFacility\Services;

use App\Models\InventoryStock;
use App\Models\OrderPackageItem;
use App\Services\FulfillmentFacility\FulfillmentFacilityInterface;
use Illuminate\Support\Facades\DB;
use Override;

class MultiFulfillmentFacilityService implements FulfillmentFacilityInterface
{
    #[Override]
    public function execute(OrderPackageItem $orderPackageitem)
    {
        DB::transaction(function () use ($orderPackageitem) {
            foreach ($orderPackageitem->facilities as $facilityId => $data) {
                $facility = InventoryStock::findOrFail($facilityId);
    
                $facility->reserveStock($data['allocated_quantity']);
    
                $orderPackageitem->orderPackageItemFacilities()->create([
                    'facility_id' => $facilityId,
                    'allocated_quantity' => $data['allocated_quantity']
                ]);
            }
        });
        
        return 'Multiple fulfillment... Created';
    }
}