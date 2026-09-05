<?php

namespace App\Models;

use App\Enums\OrderPackageStatus as OrderPackageStatusEnum;
use Database\Factories\OrderPackageStatusFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderPackageStatus extends Model
{
    /** @use HasFactory<OrderPackageStatusFactory> */
    use HasFactory;

    protected $fillable = [
        'changed_by_id',
        'status',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'status' => OrderPackageStatusEnum::class
        ];
    }

    public function orderPackage(): BelongsTo
    {
        return $this->belongsTo(OrderPackage::class);
    }
}
