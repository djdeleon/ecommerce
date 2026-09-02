<?php

namespace App\Services\Orders;

use App\Enums\OrderItemStatus;
use App\Models\Order;

trait OrderCancellationTrait
{
    public function cancelItems(Order $order)
    {
        $order->orderItems->each(function ($orderItem) {
            $orderItem->orderItemStatuses()->create([
                'status' => OrderItemStatus::CANCELLED,
                'changed_by_id' => $orderItem->order->customer->user_id,
                'notes' => 'Customer cancelled the order.',
            ]);
        });
    }
}