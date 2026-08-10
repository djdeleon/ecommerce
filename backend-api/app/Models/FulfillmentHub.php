<?php

namespace App\Models;

use Database\Factories\FulfillmentHubFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FulfillmentHub extends Model
{
    /** @use HasFactory<FulfillmentHubFactory> */
    use HasFactory;

    protected $fillable = ['name'];
}
