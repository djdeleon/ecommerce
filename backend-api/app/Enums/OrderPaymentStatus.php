<?php

namespace App\Enums;

enum OrderPaymentStatus: string
{
    case Pending       = 'pending';        // Customer initiated checkout, gateway is processing, pending is temporary (pending record is mutable waiting for the gateway response)
    case Authorized    = 'authorized';     // Funds are held/reserved on card but not yet withdrawn
    case Completed     = 'completed';      // Funds successfully captured/settled (triggers ToShip)
    case Failed        = 'failed';         // Insufficient funds, card declined, or session expired
    case Voided        = 'voided';         // Authorization cancelled before capture
    case PartialRefund = 'partial_refund'; // Partial refunds to customer (triggered by cancellation/rejections)
    case Refunded      = 'refunded';       // Funds returned to customer (triggered by cancellation/rejections)

    /**
     * Legal Transition States
     */
    public function canTransitionTo(self $target): bool
    {
        return match($this) {
            self::Pending    => in_array($target, [self::Authorized, self::Completed, self::Failed]),
            self::Authorized => in_array($target, [self::Completed, self::Voided]),
            self::Completed  => in_array($target, [self::PartialRefund, self::Refunded]),
            default          => false, // Terminal States: Failed, Voided, Refunded
        };
    }
}
