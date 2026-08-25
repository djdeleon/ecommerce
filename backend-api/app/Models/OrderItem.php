<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class OrderItem extends Model
{
    protected $fillable = [
        'variant_id',
        'vendor_id',
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

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(Vendor::class);
    }

    public function orderItemStatus(): HasOne
    {
        return $this->hasOne(OrderItemStatuses::class);
    }

    public function sellerPayoutLedger(): HasOne
    {
        return $this->hasOne(SellerPayoutLedger::class);
    }
}
