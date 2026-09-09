<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class LogisiticService
{
    /**
     * Need Actual Weight and Volumetric Weight
     * Actual Weight vs. Volumetric Weight: J&T Express measures both the actual weight (via scale) 
     * and the volumetric weight using the package dimensions (Length × Width × Height ÷ 3500). 
     * Shopee charges whichever value is higher.
     */
    public function calculateShippingFee(string $zoneA, string $zoneB, float $weight)
    {
        // weight could be Actual or Volumetric depends which one is higher.
        $response = Http::withToken(config('services.logistic.key'))
            ->post('http://logistics:8000/jnt/shipping-fee', [
                'origin_zone' => $zoneA,
                'destination_zone' => $zoneB,
                'weight_kg' => $weight,
            ]);

        if ($response->failed()) {
            return response()->json(['message' => 'Failed to calculate shipping fee.']);
        }

        return $response->json()['data'];
    }
}