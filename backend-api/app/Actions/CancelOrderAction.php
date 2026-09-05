<?php

namespace App\Actions;

use App\Enums\OrderPackageStatus;
use App\Models\Order;
use App\Models\OrderPackage;
use App\Services\Orders\OrderCancellationFactory;

class CancelOrderAction
{
    public function __construct(
        protected OrderCancellationFactory $orderCancellationFactory
    ) {}
    
    public function execute(Order|OrderPackage $orderOrPackage)
    {
        if ($orderOrPackage instanceof OrderPackage) {
            $orderOrPackage->ensureItemsCanTransition(OrderPackageStatus::Cancelled);
            
            $current = $orderOrPackage->getLatestOrderPackagePayment->status;
            
            $orderCancellation = $this->orderCancellationFactory->make($current);

            $orderCancellation->cancel($orderOrPackage);
        } else {
            $orderOrPackage->ensurePackagesCanTransition(OrderPackageStatus::Cancelled);
            
            $current = $orderOrPackage->orderPackages[0]->getLatestOrderPackagePayment->status;
            
            $orderCancellation = $this->orderCancellationFactory->make($current);

            $orderCancellation->cancel($orderOrPackage);
        }
    }
}