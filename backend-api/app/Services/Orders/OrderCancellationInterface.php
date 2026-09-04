<?php

namespace App\Services\Orders;

use App\Models\Order;
use App\Models\OrderPackage;

interface OrderCancellationInterface
{
    public function cancel(Order|OrderPackage $orderOrPackage);
}