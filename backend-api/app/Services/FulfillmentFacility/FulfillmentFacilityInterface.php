<?php

namespace App\Services\FulfillmentFacility;

use App\Models\OrderPackageItem;

interface FulfillmentFacilityInterface
{
    public function execute(OrderPackageItem $orderPackageitem);
}