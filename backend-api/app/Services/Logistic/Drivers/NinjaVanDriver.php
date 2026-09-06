<?php

namespace App\Services\Logistic\Drivers;

use App\Models\Order;
use App\Services\Logistic\LogisticInterface;
use Override;

class NinjaVanDriver implements LogisticInterface
{
    #[Override]
    public function createShippingOrder(Order $order)
    {
        dd('ninja create shipping order');
    }
}