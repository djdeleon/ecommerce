<?php

namespace App\Services\Logistic\Drivers;

use App\Models\Order;
use App\Services\Logistic\LogisticInterface;
use Override;

class FlashExpressDriver implements LogisticInterface
{
    #[Override]
    public function createShippingOrder(Order $order)
    {
        dd('Flash create shipping order');
    }
}