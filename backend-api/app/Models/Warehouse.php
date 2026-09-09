<?php

namespace App\Models;

use App\DataObjects\Coordinate;
use Database\Factories\WarehouseFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\Relations\MorphOne;

class Warehouse extends Model
{
    /** @use HasFactory<WarehouseFactory> */
    use HasFactory;

    protected $fillable = [
        'name',
        'contact_number'
    ];

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(Vendor::class);
    }

    public function inventoryStocks(): MorphMany
    {
        return $this->morphMany(InventoryStock::class, 'inventorable');
    }

    public function address(): MorphOne
    {
        return $this->morphOne(EntityAddress::class, 'addressable');
    }

    public function fullAddress(): string
    {
        $addressQuery = array_filter([
            $this->address->street_address,
            $this->address->city->name,
            $this->address->province->name,
            'Philippines'
        ]);

        return implode(', ', $addressQuery);
    }

    public function coordinates(): Coordinate
    {
        return new Coordinate($this->address->latitude, $this->address->longitude);
    }
}
