<?php

namespace App\Models;

use Database\Factories\FulfillmentHubFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class FulfillmentHub extends Model
{
    /** @use HasFactory<FulfillmentHubFactory> */
    use HasFactory;

    protected $fillable = ['name'];

    public function inventoryStocks(): MorphMany
    {
        return $this->morphMany(InventoryStock::class, 'inventorable');
    }
}
