<?php

namespace App\Models;

use Database\Factories\OrderItemFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class OrderItem extends Model
{
    /** @use HasFactory<OrderItemFactory> */
    use HasFactory;

    protected $fillable = [
        'variant_id',
        'quantity_ordered',
        'price_at_purchased',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function variant(): BelongsTo
    {
        return $this->belongsTo(Variant::class);
    }

    public function orderItemStatuses(): HasMany
    {
        return $this->hasMany(OrderItemStatus::class);
    }

    public function latestOrderItemStatus(): HasOne
    {
        return $this->orderItemStatuses()->one()->latestOfMany();
    }

    public function sellerPayoutLedger(): HasOne
    {
        return $this->hasOne(SellerPayoutLedger::class);
    }
}
