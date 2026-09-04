<?php

namespace App\Services\Orders;

use App\Enums\OrderPaymentStatus;
use App\Services\Orders\OrderCancellationInterface;

class OrderCancellationFactory
{
    public function make(OrderPaymentStatus $paymentStatus): OrderCancellationInterface
    {
        if ($paymentStatus === OrderPaymentStatus::Completed) {
            return app(PaidOrderCancellation::class);
        }

        if (in_array($paymentStatus, [OrderPaymentStatus::Pending, OrderPaymentStatus::Authorized, OrderPaymentStatus::Failed])) {
            return app(UnpaidOrderCancellation::class);
        }

        return app(PaidOrderCancellation::class);
    }
}