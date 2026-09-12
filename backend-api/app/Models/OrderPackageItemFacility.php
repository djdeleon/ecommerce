<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OrderPackageItemFacility extends Model
{
    protected $fillable = [
        'facility_id',
        'allocated_quantity'
    ];
}
