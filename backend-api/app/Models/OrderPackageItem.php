<?php

namespace App\Models;

use App\Models\OrderPackage;
use App\Models\OrderPackageItemFacility;
use App\Models\Variant;
use Database\Factories\OrderPackageItemFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class OrderPackageItem extends Model
{
    /** @use HasFactory<OrderPackageItemFactory> */
    use HasFactory;

    protected $fillable = [
        'variant_id',
        'ordered_quantity',
        'price_at_purchased',
    ];

    public function orderPackage(): BelongsTo
    {
        return $this->belongsTo(OrderPackage::class);
    }

    public function orderPackageItemFacilities(): HasMany
    {
        return $this->hasMany(OrderPackageItemFacility::class);
    }

    public function variant(): BelongsTo
    {
        return $this->belongsTo(Variant::class);
    }
}
