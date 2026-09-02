<?php

namespace App\Actions;

use App\Enums\OrderItemStatus;
use App\Models\Order;
use App\Services\Orders\OrderCancellationFactory;

class CancelOrderAction
{
    public function __construct(
        protected OrderCancellationFactory $orderCancellationFactory
    ) {}
    
    public function execute(Order $order)
    {
        $current = $order->latestOrderPayment->status;

        $order->ensureItemsCanTransition(OrderItemStatus::CANCELLED);

        $orderCancellation = $this->orderCancellationFactory->make($current);

        $orderCancellation->cancel($order);
    }
}