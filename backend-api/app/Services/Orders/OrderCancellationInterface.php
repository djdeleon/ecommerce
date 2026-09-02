<?php

namespace App\Services\Orders;

use App\Models\Order;

interface OrderCancellationInterface
{
    public function cancel(Order $order);
}