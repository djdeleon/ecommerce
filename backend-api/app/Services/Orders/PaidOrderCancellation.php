<?php

namespace App\Services\Orders;

use App\Enums\OrderPackagePaymentStatus;
use App\Models\Order;
use App\Models\OrderPackage;
use App\Services\Orders\OrderCancellationInterface;
use App\Services\Orders\OrderCancellationTrait;
use Illuminate\Support\Facades\DB;
use Override;

class PaidOrderCancellation implements OrderCancellationInterface
{
    use OrderCancellationTrait;

    #[Override]
    public function cancel(Order|OrderPackage $orderOrPackage)
    {
        if ($orderOrPackage instanceof Order) {
            DB::transaction(function () use ($orderOrPackage) {
                $this->cancelItems($orderOrPackage);

                $actorRole = request()->user()->roles()->pluck('name')[0];

                $orderOrPackage->orderPackages->each(function ($item) use ($actorRole) {
                    $orderPayment = $item->getLatestOrderPackagePayment;
        
                    $item->orderPackagePayments()->create([
                        'payment_method' => $orderPayment['payment_method'],
                        'transaction_reference' => $orderPayment['transaction_reference'],
                        'amount_paid' => $orderPayment['amount_paid'],
                        'gateway_reference' => $orderPayment['gateway_reference'],
                        'transaction_fee' => $orderPayment['transaction_fee'],
                        'net_amount' => $orderPayment['net_amount'],
                        'gateway_response' => $orderPayment['gateway_response'],
                        'status' => OrderPackagePaymentStatus::Refunded,
                    ]);
                });
            });
        } else {
            DB::transaction(function () use ($orderOrPackage) {
                $this->cancelItems($orderOrPackage);

                $orderPayment = $orderOrPackage->getLatestOrderPackagePayment;

                $orderOrPackage->orderPackagePayments()->create([
                    'payment_method' => $orderPayment['payment_method'],
                    'transaction_reference' => $orderPayment['transaction_reference'],
                    'amount_paid' => $orderPayment['amount_paid'],
                    'gateway_reference' => $orderPayment['gateway_reference'],
                    'transaction_fee' => $orderPayment['transaction_fee'],
                    'net_amount' => $orderPayment['net_amount'],
                    'gateway_response' => $orderPayment['gateway_response'],
                    'status' => OrderPackagePaymentStatus::Refunded,
                ]);
            });
        }
    }
}