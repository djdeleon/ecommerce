<?php

namespace App\Services\Orders;

use App\Enums\OrderPaymentStatus;
use App\Models\Order;
use App\Services\Orders\OrderCancellationInterface;
use App\Services\Orders\OrderCancellationTrait;
use Illuminate\Support\Facades\DB;
use Override;

class UnpaidOrderCancellation implements OrderCancellationInterface
{
    use OrderCancellationTrait;

    #[Override]
    public function cancel(Order $order)
    {
        $orderPayment = $order->latestOrderPayment;
        
        DB::transaction(function () use ($order, $orderPayment) {
            $this->cancelItems($order);
                    
            $orderPayment->update([
                'status' => OrderPaymentStatus::FAILED,
            ]);
        });
    }
}