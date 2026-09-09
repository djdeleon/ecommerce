<?php

namespace App\Models\Address;

use Database\Factories\Address\RegionFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Region extends Model
{
    /** @use HasFactory<RegionFactory> */
    use HasFactory;

    protected $fillable = [
        'code',
        'correspondence_code',
        'name',
        'slug',
        'zone',
    ];

    public function provinces(): HasMany
    {
        return $this->hasMany(Province::class);
    }
}