<?php

namespace App\Models;

use Database\Factories\VariantFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Variant extends Model
{
    /** @use HasFactory<VariantFactory> */
    use HasFactory;

    protected $fillable = [
        'sku',
        'price',
    ];

    protected $casts = [
        'price' => 'decimal:4',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
