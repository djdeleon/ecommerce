<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SellerPayoutLedger extends Model
{
    protected $fillable = [
        'gross_amount',
        'platform_commission_fee',
        'net_payout_amount',
        'status',
    ];
}
