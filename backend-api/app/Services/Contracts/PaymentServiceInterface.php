<?php

namespace App\Services\Contracts;

use App\Models\Order;

interface PaymentServiceInterface
{
    public function pay(Order $order, ?string $paymentMethod): array;
}