<?php

namespace App\Models\Address;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Barangay extends Model
{
    protected $fillable = [
        'code',
        'correspondence_code',
        'name',
    ];

    public function city(): BelongsTo
    {
        return $this->belongsTo(City::class);
    }
}