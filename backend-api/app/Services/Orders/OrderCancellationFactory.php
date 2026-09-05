<?php

namespace App\Services\Orders;

use App\Enums\OrderPackagePaymentStatus;

class OrderCancellationFactory
{
    public function make(OrderPackagePaymentStatus $paymentStatus): OrderCancellationInterface
    {
        if ($paymentStatus === OrderPackagePaymentStatus::Completed) {
            return app(PaidOrderCancellation::class);
        }

        if (in_array($paymentStatus, [OrderPackagePaymentStatus::Pending, OrderPackagePaymentStatus::Authorized, OrderPackagePaymentStatus::Failed])) {
            return app(UnpaidOrderCancellation::class);
        }

        return app(PaidOrderCancellation::class);
    }
}