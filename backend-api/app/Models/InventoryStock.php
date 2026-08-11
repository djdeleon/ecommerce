<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class InventoryStock extends Model
{
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
}
