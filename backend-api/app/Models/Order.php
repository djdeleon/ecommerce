<?php

namespace App\Models;

use App\Enums\OrderItemStatus;
use Database\Factories\OrderFactory;
use Exception;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Order extends Model
{
    /** @use HasFactory<OrderFactory> */
    use HasFactory;

    protected $fillable = [
        'shipping_address',
        'total_amount',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function orderItems(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function orderPayments(): HasMany
    {
        return $this->hasMany(OrderPayment::class);
    }

    public function latestOrderPayment(): HasOne
    {
        return $this->orderPayments()->one()->latestOfMany();
    }

    public function ensureItemsCanTransition(OrderItemStatus $target)
    {
        $actorId = request()->user()->id;
        $actorRole = request()->user()->roles()->pluck('name')[0];
        $currentPaymentStatus = $this->latestOrderPayment->status;

        // need to get all the order items belong to the vendor
        $filteredOrderItems = $this->orderItems->filter(function ($orderItem) use ($actorId) {
            if ($orderItem->variant->product->vendor->user_id === $actorId) {
                return $orderItem;
            }
        });

        $filteredOrderItems->each(function ($orderItem) use ($target, $currentPaymentStatus, $actorRole) {
            $currentItemStatus = $orderItem->latestOrderItemStatus->status;

            $canTransition = $currentItemStatus->canTransitionWithPayment($target, $currentPaymentStatus, $actorRole);

            if (! $canTransition) {
                throw new Exception("[{$currentItemStatus->value}] Item ID {$orderItem->id} cannot transition to cancelled because it is in payment status of [{$currentPaymentStatus->value}].");
            }
        });

        return true;
    }
}
