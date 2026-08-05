<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Vendor extends Model
{
    protected $fillable = [
        'shop_name',
        'business_tin',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
