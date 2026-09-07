<?php

namespace App\Models\Address;

use Database\Factories\Address\CityFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class City extends Model
{
    /** @use HasFactory<CityFactory> */
    use HasFactory;
    
    protected $fillable = [
        'code',
        'correspondence_code',
        'name',
    ];

    public function province(): BelongsTo
    {
        return $this->belongsTo(Province::class);
    }
    
    public function barangays(): HasMany
    {
        return $this->hasMany(Barangay::class);
    }
}