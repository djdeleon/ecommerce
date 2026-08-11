<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InventoryLedger extends Model
{
    const UPDATED_AT = null;

    protected $fillable = [
        'user_id',
        'delta_quantity',
        'entry_type',
    ];
}
