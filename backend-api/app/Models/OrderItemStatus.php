<?php

namespace App\Models;

use App\Enums\OrderItemStatus as StatusEnum;
use Database\Factories\OrderItemStatusFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderItemStatus extends Model
{
    /** @use HasFactory<OrderItemStatusFactory> */
    use HasFactory;

    protected $fillable = [
        'status',
        'changed_by_id',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'status' => StatusEnum::class
        ];
    }

    public function orderItem(): BelongsTo
    {
        return $this->belongsTo(OrderItem::class);
    }
}
