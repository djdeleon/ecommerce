<?php

namespace App\Services\Logistic;

use App\Models\Order;

interface LogisticInterface
{
    public function createShippingOrder(Order $order); // beware that we can pass Order Package as well, for now let's deal with the entire order.

    public function volumetricWeight(float $height, float $length, float $width): float;
}