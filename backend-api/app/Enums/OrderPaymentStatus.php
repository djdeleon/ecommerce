<?php

namespace App\Enums;

enum OrderPaymentStatus: string
{
    case PENDING    = 'pending';    // Customer initiated checkout, gateway is processing, pending is temporary (pending record is mutable waiting for the gateway response)
    case AUTHORIZED = 'authorized'; // Funds are held/reserved on card but not yet withdrawn
    case COMPLETED  = 'completed';  // Funds successfully captured/settled (triggers TO_SHIP)
    case FAILED     = 'failed';     // Insufficient funds, card declined, or session expired
    case VOIDED     = 'voided';     // Authorization cancelled before capture
    case REFUNDED   = 'refunded';   // Funds returned to customer (triggered by cancellation/rejections)

    /**
     * Legal Transition States
     */
    public function canTransitionTo(self $target): bool
    {
        return match($this) {
            self::PENDING    => in_array($target, [self::AUTHORIZED, self::COMPLETED, self::FAILED]),
            self::AUTHORIZED => in_array($target, [self::COMPLETED, self::VOIDED]),
            self::COMPLETED  => in_array($target, [self::REFUNDED]),
            default          => false, // Terminal States: FAILED, VOIDED, REFUNDED
        };
    }
}
