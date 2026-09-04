<?php

namespace App\Services\Orders;

use App\Enums\OrderPackageStatus;
use App\Models\Order;
use App\Models\OrderPackage;

trait OrderCancellationTrait
{
    public function cancelItems(Order|OrderPackage $orderOrPackage)
    {
        if ($orderOrPackage instanceof Order) {
            $actorRole = request()->user()->roles()->pluck('name')[0];
            $actorId = request()->user()->id;
    
            $target = OrderPackageStatus::Cancelled;

            $orderOrPackage->orderPackages->each(function ($package) use ($target, $actorId, $actorRole) {
                $package->orderPackagestatuses()->create([
                    'status' => $target,
                    'changed_by_id' => $actorId,
                    'notes' => ucfirst($actorRole) . ' ' . $target->value . ' the order.',
                ]);
            });
    
        } else {
            $actorRole = request()->user()->roles()->pluck('name')[0];
            $actorId = request()->user()->id;

            if ($actorRole === 'vendor') {
                $target = OrderPackageStatus::Rejected;
    
                $orderOrPackage->orderPackagestatuses()->create([
                    'status' => $target,
                    'changed_by_id' => $actorId,
                    'notes' => ucfirst($actorRole) . ' ' . $target->value . ' the order.',
                ]);
            } else { 
                $target = OrderPackageStatus::Cancelled;
    
                $orderOrPackage->orderPackagestatuses()->create([
                    'status' => $target,
                    'changed_by_id' => $actorId,
                    'notes' => ucfirst($actorRole) . ' ' . $target->value . ' the order.',
                ]);
            }
        }
    }
}