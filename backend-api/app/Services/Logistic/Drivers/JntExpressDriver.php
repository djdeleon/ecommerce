<?php

namespace App\Services\Logistic\Drivers;

use App\Models\Order;
use App\Services\Logistic\LogisticInterface;
use Override;

class JntExpressDriver implements LogisticInterface
{
    #[Override]
    public function createShippingOrder(Order $order)
    {
        dd('JnT create shipping order');
    }
}