<?php

namespace App\Services\Orders;

use App\Enums\OrderItemStatus;
use App\Models\Order;

trait OrderCancellationTrait
{
    public function cancelItems(Order $order)
    {
        $actorRole = request()->user()->roles()->pluck('name')[0];
        $actorId = request()->user()->id;

        if ($actorRole === 'vendor') {
            // need to get all the order items belong to the vendor
            $filteredOrderItems = $order->orderItems->filter(function ($orderItem) use ($actorId) {
                if ($orderItem->variant->product->vendor->user_id === $actorId) {
                    return $orderItem;
                }
            });

            $target = OrderItemStatus::Rejected;

            $filteredOrderItems->each(function ($orderItem) use ($target, $actorId, $actorRole) {
                $orderItem->orderItemStatuses()->create([
                    'status' => $target,
                    'changed_by_id' => $actorId,
                    'notes' => ucfirst($actorRole) . ' ' . $target->value . ' the order.',
                ]);
            });
        } else { 
            $target = OrderItemStatus::Cancelled;

            $order->orderItems->each(function ($orderItem) use ($target, $actorId, $actorRole) {
                $orderItem->orderItemStatuses()->create([
                    'status' => $target,
                    'changed_by_id' => $actorId,
                    'notes' => ucfirst($actorRole) . ' ' . $target->value . ' the order.',
                ]);
            });
        }
    }
}