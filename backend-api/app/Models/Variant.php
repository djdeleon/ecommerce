<?php

namespace App\Models;

use App\Casts\MoneyCast;
use Database\Factories\VariantFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Variant extends Model
{
    /** @use HasFactory<VariantFactory> */
    use HasFactory;

    protected $fillable = [
        'sku',
        'price',
    ];

    protected function casts(): array
    {
        return [
            'price' => MoneyCast::class,
        ];
    }

    protected static function booted(): void
    {
        static::updated(function (Variant $variant) {
            if ($variant->wasChanged('price')) {
                $variant->priceLedgers()->create([
                    'old_price' => bcdiv($variant->getOriginal('price')->getAmount(), 10000, 4),
                    'new_price' => bcdiv($variant->price->getAmount(), 10000, 4),
                    'changed_by_id' => $variant->product->vendor->user_id ?? null,
                    'created_at' => now(),
                ]);
            }
        });
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function priceLedgers(): HasMany
    {
        return $this->hasMany(ProductPriceLedger::class);
    }
}
