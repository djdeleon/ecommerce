<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderPackageItemFacility extends Model
{
    protected $fillable = [
        'facility_id',
        'allocated_quantity'
    ];

    public function orderPackageItem(): BelongsTo
    {
        return $this->belongsTo(OrderPackageItem::class);
    }

    public function inventoryStock(): BelongsTo
    {
        return $this->belongsTo(InventoryStock::class, 'facility_id');
    }

    public function fullAddress()
    {
        $address = $this->inventoryStock()->first()->inventorable()->first()->address()->first();

        return "{$address->city->name}, {$address->province->name}, {$address->region->name}, Philippines";
    }

    public function zone()
    {
        return $this->inventoryStock()->first()->inventorable()->first()->address()->first()->region->zone;
    }
}
