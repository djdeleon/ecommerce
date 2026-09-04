<?php

namespace App\Models;

use App\Enums\OrderPackagePaymentStatus;
use App\Enums\OrderPackageStatus;
use Database\Factories\OrderFactory;
use Exception;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Order extends Model
{
    /** @use HasFactory<OrderFactory> */
    use HasFactory;

    protected $fillable = [
        'shipping_address',
        'total_amount',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function orderPackages(): HasMany
    {
        return $this->hasMany(OrderPackage::class);
    }

    public function orderPackagePayments(): HasMany
    {
        return $this->hasMany(OrderPackagePayment::class);
    }

    public function latestOrderPackagePayment(): HasOne
    {
        return $this->orderPackagePayments()->one()->latestOfMany();
    }

    public function ensurePackagesCanTransition(OrderPackageStatus $target): bool
    {
        // $isAllPackagesPending = $this->orderPackages->every(function ($package) {
        //     return ($package->getLatestOrderPackagePayment->status === OrderPackagePaymentStatus::Pending);
        // });

        // if (! $isAllPackagesPending) {
        //     throw new Exception("This order can no longer be cancelled.");
        // }

        $this->orderPackages->each(function ($item) use ($target) {
            $actorRole = request()->user()->roles()->pluck('name')[0];
            $currentPaymentStatus = $item->getLatestOrderPackagePayment->status;
            $currentPackageStatus = $item->getLatestOrderPackageStatus->status;
    
            $canTransition = $currentPackageStatus->canTransitionWithPayment($target, $currentPaymentStatus, $actorRole);
    
            if (! $canTransition) {
                throw new Exception("This [{$currentPackageStatus->value}] package cannot transition to cancelled because it is in payment status of [{$currentPaymentStatus->value}].");
            }
        });

        return true;
    }
}
