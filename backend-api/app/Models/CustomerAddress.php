<?php

namespace App\Models;

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

}
