<?php

namespace App\Models;

use App\Enums\OrderPackagePaymentStatus;
use Database\Factories\OrderPackagePaymentFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderPackagePayment extends Model
{
    /** @use HasFactory<OrderPackagePaymentFactory> */
    use HasFactory;

    protected $fillable = [
        'payment_method',
        'transaction_reference',
        'amount_paid',
        'gateway_reference',
        'transaction_fee',
        'net_amount',
        'gateway_response',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'status' => OrderPackagePaymentStatus::class,
            'gateway_response' => 'array',
        ];
    }

    public function orderPackage(): BelongsTo
    {
        return $this->belongsTo(OrderPackage::class);
    }
}
