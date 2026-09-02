<?php

namespace App\Services\Orders;

use App\Enums\OrderPaymentStatus;
use App\Services\Orders\OrderCancellationInterface;

class OrderCancellationFactory
{
    public function make(OrderPaymentStatus $paymentStatus): OrderCancellationInterface
    {
        if ($paymentStatus === OrderPaymentStatus::COMPLETED) {
            return app(PaidOrderCancellation::class);
        }

        if (in_array($paymentStatus, [OrderPaymentStatus::PENDING, OrderPaymentStatus::AUTHORIZED, OrderPaymentStatus::FAILED])) {
            return app(UnpaidOrderCancellation::class);
        }

        return app(PaidOrderCancellation::class);
    }
}