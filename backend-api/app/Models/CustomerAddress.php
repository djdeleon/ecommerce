<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CustomerAddress extends Model
{
    protected $fillable = [
        'recipient_name',
        'phone_number',
        'region_id',
        'province_id',
        'city_id',
        'barangay_id',
        'street_address',
        'zip_code',
        'is_default',
        'label',
    ];
    
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }
}
