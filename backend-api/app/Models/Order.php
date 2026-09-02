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
        $actor = 'customer';
        $currentPaymentStatus = $this->latestOrderPayment->status;

        // dd($actor, $target, $currentPaymentStatus);
        $this->orderItems->each(function ($orderItem) use ($target, $currentPaymentStatus, $actor) {
            $currentItemStatus = $orderItem->latestOrderItemStatus->status;

            $canTransition = $currentItemStatus->canTransitionWithPayment($target, $currentPaymentStatus, $actor);

            if (! $canTransition) {
                throw new Exception("Item ID {$orderItem->id} cannot be cancelled because it is in [{$currentItemStatus->value}] status with payment [{$currentPaymentStatus->value}].");
            }
        });

        return true;
    }
}
