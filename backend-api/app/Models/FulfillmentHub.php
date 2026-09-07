<?php

namespace App\Models;

use Database\Factories\FulfillmentHubFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\Relations\MorphOne;

class FulfillmentHub extends Model
{
    /** @use HasFactory<FulfillmentHubFactory> */
    use HasFactory;

    protected $fillable = [
        'name',
        'contact_number'
    ];

    public function inventoryStocks(): MorphMany
    {
        return $this->morphMany(InventoryStock::class, 'inventorable');
    }

    public function address(): MorphOne
    {
        return $this->morphOne(EntityAddress::class, 'addressable');
    }
}
