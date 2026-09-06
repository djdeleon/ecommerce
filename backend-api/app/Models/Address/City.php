<?php

namespace App\Models\Address;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class City extends Model
{
    public function province(): BelongsTo
    {
        return $this->belongsTo(Province::class);
    }
    
    public function barangays(): HasMany
    {
        return $this->hasMany(Barangay::class);
    }
}