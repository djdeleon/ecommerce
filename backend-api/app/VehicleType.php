<?php

namespace App;

enum VehicleType: string
{
    case MOTORCYCLE = 'motorcycle';
    case VAN = 'van';
    case TRUCK = 'truck';

    public function label(): string
    {
        return match($this) {
            self::MOTORCYCLE => 'Motorcycle',
            self::TRUCK => 'Commercial Truck',
            self::VAN => 'Cargo Van',
        };
    }
}
