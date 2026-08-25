<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OrderItemStatuses extends Model
{
    protected $fillable = [
        'status',
        'changed_by_id',
        'notes',
    ];
}
