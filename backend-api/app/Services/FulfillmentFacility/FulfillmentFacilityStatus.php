<?php

namespace App\Services\FulfillmentFacility;

enum FulfillmentFacilityStatus: string
{
    case Fulfill = 'fulfill';
    case Partial = 'partial';
    case Zero    = 'zero';

    public static function stockStatus(int $quantity, int $quantity_available): FulfillmentFacilityStatus
    {
        return match(true) {
            $quantity <= $quantity_available                            => self::Fulfill,
            $quantity > $quantity_available && $quantity_available > 0 => self::Partial,
            default                                                     => self::Zero
        };
    }
}
