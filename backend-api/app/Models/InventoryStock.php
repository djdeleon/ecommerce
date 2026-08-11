<?php

namespace App\Models;

use App\Exceptions\InsufficientStockException;
use Database\Factories\InventoryStockFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Support\Facades\DB;

class InventoryStock extends Model
{
    /** @use HasFactory<InventoryStockFactory> */
    use HasFactory;

    protected $fillable = [
        'inventorable_type',
        'inventorable_id',
        'quantity_available',
        'quantity_reserved',
    ];

    public function inventorable(): MorphTo
    {
        return $this->morphTo();
    }

    public function inventoryLedgers(): HasMany
    {
        return $this->hasMany(InventoryLedger::class);
    }

    public function variant(): BelongsTo
    {
        return $this->belongsTo(Variant::class);
    }

    public function reserveStock(int $quantity): void
    {
        if ($quantity <= 0) {
            throw new \InvalidArgumentException('Quantity must be greater than zero.');
        }

        if ($quantity > $this->quantity_available) {
            throw new InsufficientStockException();
        }

        DB::transaction(function () use ($quantity) {
            $this->decrement('quantity_available', $quantity);
            $this->increment('quantity_reserved', $quantity);

            $this->inventoryLedgers()->create([
                'user_id' => $this->variant->product->vendor->user_id,
                'delta_quantity' => -$quantity,
                'entry_type' => 'reservation'
            ]);
        });
    }

    public function releaseStock(int $quantity): void
    {
        if ($quantity <= 0) {
            throw new \InvalidArgumentException('Quantity must be greater than zero.');
        }
        
        if ($quantity > $this->quantity_reserved) {
            throw new InsufficientStockException('Cannot release more stock than is currently reserved.');
        }

        DB::transaction(function () use ($quantity) {
            $this->increment('quantity_available', $quantity);
            $this->decrement('quantity_reserved', $quantity);

            $this->inventoryLedgers()->create([
                'user_id' => $this->variant->product->vendor->user_id,
                'delta_quantity' => $quantity,
                'entry_type' => 'release'
            ]);
        });
    }
}
