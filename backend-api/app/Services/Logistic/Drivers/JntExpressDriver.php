<?php

namespace App\Services\Logistic\Drivers;

use App\Models\Order;
use App\Services\Logistic\LogisticInterface;
use Override;

class JntExpressDriver implements LogisticInterface
{
    #[Override]
    public function createShippingOrder(Order $order)
    {
        dd('JnT create shipping order');
    }
    
    #[Override]
    public function volumetricWeight(float $height, float $length, float $width): float
    {
        $packageDimensions = $height * $length * $width; // cm

        return $packageDimensions / 3500; // kg
    }
}