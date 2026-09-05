<?php

namespace App\Models;

use App\Enums\OrderPackageStatus as OrderPackageStatusEnums;
use App\Models\OrderPackageStatus;
use Database\Factories\OrderPackageFactory;
use Exception;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class OrderPackage extends Model
{
    /** @use HasFactory<OrderPackageFactory> */
    use HasFactory;

    protected $fillable = ['vendor_id'];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(Vendor::class);
    }

    public function orderPackageItems(): HasMany
    {
        return $this->hasMany(OrderPackageItem::class);
    }

    public function orderPackagestatuses(): HasMany
    {
        return $this->hasMany(OrderPackageStatus::class);
    }

    public function orderPackagePayments(): HasMany
    {
        return $this->hasMany(OrderPackagePayment::class);
    }

    public function getLatestOrderPackageStatus(): HasOne
    {
        return $this->orderPackagestatuses()->one()->latestOfMany();
    }

    public function getLatestOrderPackagePayment(): HasOne
    {
        return $this->orderPackagePayments()->one()->latestOfMany();
    }

    public function ensureItemsCanTransition(OrderPackageStatusEnums $target)
    {
        $actorRole = request()->user()->roles()->pluck('name')[0];
        $currentPaymentStatus = $this->getLatestOrderPackagePayment->status;
        $currentPackageStatus = $this->getLatestOrderPackageStatus->status;

        $canTransition = $currentPackageStatus->canTransitionWithPayment($target, $currentPaymentStatus, $actorRole);

        if (! $canTransition) {
            throw new Exception("This [{$currentPackageStatus->value}] package cannot transition to [{$target->value}] with a payment status of [{$currentPaymentStatus->value}] by the [{$actorRole}].");
        }

        return true;
    }
}
