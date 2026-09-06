<?php

namespace App\Models\Address;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Region extends Model
{
    protected $fillable = [
        'code',
        'correspondence_code',
        'name',
    ];

    public function provinces(): HasMany
    {
        return $this->hasMany(Province::class);
    }
}