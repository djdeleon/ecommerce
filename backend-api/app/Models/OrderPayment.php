<?php

namespace App\Models;

use App\Enums\OrderPaymentStatus;
use Database\Factories\OrderPaymentFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderPayment extends Model
{
    /** @use HasFactory<OrderPaymentFactory> */
    use HasFactory;

    protected $fillable = [
        'payment_method',
        'transaction_reference',
        'amount_paid',
        'gateway_reference',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'status' => OrderPaymentStatus::class,
        ];
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }
}
