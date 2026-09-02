<?php

namespace App\Services\Orders;

use App\Enums\OrderPaymentStatus;
use App\Models\Order;
use App\Services\Orders\OrderCancellationInterface;
use App\Services\Orders\OrderCancellationTrait;
use Illuminate\Support\Facades\DB;
use Override;

class PaidOrderCancellation implements OrderCancellationInterface
{
    use OrderCancellationTrait;

    #[Override]
    public function cancel(Order $order)
    {
        $orderPayment = $order->latestOrderPayment;

        DB::transaction(function () use ($order, $orderPayment) {
            $this->cancelItems($order);

            $order->orderPayments()->create([
                'payment_method' => $orderPayment['payment_method'],
                'transaction_reference' => $orderPayment['transaction_reference'],
                'amount_paid' => $orderPayment['amount_paid'],
                'gateway_reference' => $orderPayment['gateway_reference'],
                'transaction_fee' => $orderPayment['transaction_fee'],
                'net_amount' => $orderPayment['net_amount'],
                'gateway_response' => $orderPayment['gateway_response'],
                'status' => OrderPaymentStatus::FAILED
            ]);
        });
    }
}