<?php

namespace App\Models;

use Database\Factories\OrderPackageItemFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderPackageItem extends Model
{
    /** @use HasFactory<OrderPackageItemFactory> */
    use HasFactory;

    protected $fillable = [
        'variant_id',
        'quantity_ordered',
        'price_at_purchased',
    ];

    public function orderPackage(): BelongsTo
    {
        return $this->belongsTo(OrderPackage::class);
    }

    public function variant(): BelongsTo
    {
        return $this->belongsTo(Variant::class);
    }
}
