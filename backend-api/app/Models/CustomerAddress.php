<?php

namespace App\Models;

use App\DataObjects\Coordinate;
use App\Models\EntityAddress;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphOne;

class CustomerAddress extends Model
{
    use HasFactory;
    
    protected $fillable = [
        'recipient_name',
        'phone_number',
        'is_default',
        'label',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function address(): MorphOne
    {
        return $this->morphOne(EntityAddress::class, 'addressable');
    }

    public function fullCityAddress(): string
    {
        return "{$this->address->city->name}, {$this->address->province->name}, {$this->address->region->name}, Philippines";
    }

    public function fullAddress(): string
    {
        return "{$this->address->barangay->name}, {$this->address->city->name}, {$this->address->province->name}, {$this->address->region->name}, Philippines";
    }

    public function coordinates(): Coordinate
    {
        return new Coordinate($this->address->latitude, $this->address->longitude);
    }
}
