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

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function priceLedgers(): HasMany
    {
        return $this->hasMany(ProductPriceLedger::class)
                    ->orderByDesc('created_at');
    }
}
