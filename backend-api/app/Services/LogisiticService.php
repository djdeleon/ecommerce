<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class LogisiticService
{
    public function webhook()
    {
        /**
         * The first scan of the barcode
         * - Side Effects
         * - - $orderPackageItem->facility->fulfillReservedStock()
         */
    }

    public function book()
    {
        $response = Http::withToken(config('services.logistic.key'))
            ->post('http://logistics:8000/jnt/book', [
                
            ]);
    }

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