<?php

namespace App\Services\Orders;

use App\Enums\OrderPackagePaymentStatus;
use App\Models\Order;
use App\Models\OrderPackage;
use App\Services\Orders\OrderCancellationInterface;
use App\Services\Orders\OrderCancellationTrait;
use Illuminate\Support\Facades\DB;
use Override;

class UnpaidOrderCancellation implements OrderCancellationInterface
{
    use OrderCancellationTrait;

    #[Override]
    public function cancel(Order|OrderPackage $orderOrPackage)
    {
        if ($orderOrPackage instanceof Order) {
            DB::transaction(function () use ($orderOrPackage) {
                $orderOrPackage->orderPackages->each(function ($item) {
                    $this->cancelItems($item);
       
                    $item->getLatestOrderPackagePayment->update([
                        'status' => OrderPackagePaymentStatus::Failed,
                    ]);
                });
            });
        } else {
            DB::transaction(function () use ($orderOrPackage) {
                $this->cancelItems($orderOrPackage);
    
                $orderOrPackage->getLatestOrderPackagePayment->update([
                    'status' => OrderPackagePaymentStatus::Failed,
                ]);
            });
        }
    }
}