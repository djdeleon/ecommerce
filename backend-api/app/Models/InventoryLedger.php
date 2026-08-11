<?php

namespace App\Models;

use Database\Factories\InventoryLedgerFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InventoryLedger extends Model
{
    /** @use HasFactory<InventoryLedgerFactory> */
    use HasFactory;

    const UPDATED_AT = null;

    protected $fillable = [
        'user_id',
        'delta_quantity',
        'entry_type',
    ];

    public static function booted(): void
    {
        static::updating(function () {
            throw new \LogicException('Inventory ledger records are strictly immutable and cannot be updated.');
        });

        static::deleting(function () {
            throw new \LogicException('Inventory ledger records are strictly immutable and cannot be deleted.');
        });
    }
}
