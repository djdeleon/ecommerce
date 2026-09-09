<?php

namespace App\Services;

use App\DataObjects\Coordinate;
use App\Models\CartItem;
use App\Models\CustomerAddress;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Http;

class GeolocationService
{
    public function nearestHubWithStockCollection(Collection $cartItems, Coordinate $customerCoords)
    {
        dd($cartItems->pluck('id'));

        $vendorItems = $cartItems->groupBy(function ($item) {
            return $item->variant->product->vendor->id;
        });

        $vendorItemMaps = $vendorItems->map(function ($items, $vendorId) {
            return [
                'vendor_id' => $vendorId, 
                'items' => $items->map(function ($item) {
                    return [
                        'variant_id' => $item->variant_id,
                        'quantity' => $item->quantity,
                    ];
                })->values(),
            ];
        })->values();

        dd($vendorItemMaps->toArray()[0]['items'][0]);

        
        $vendorItems->map(function ($items, $vendorId) use ($customerCoords) {
            $items->each(function ($item) use ($customerCoords) {
                $warehouses = $item->variant->inventoryStocks->filter(function ($stock) use ($item) {
                    return $item->quantity <= $stock->quantity_available;
                })->sortBy(function ($stock) use ($customerCoords) {
                    return $this->calculateHaversineDistance(
                        $customerCoords->lat,
                        $customerCoords->lon,
                        $stock->inventorable->coordinates()->lat,
                        $stock->inventorable->coordinates()->lon,
                    );
                })->first()->inventorable;
                dd($warehouses);
            });

            dd($vendorId, $items);
        });
        return $cartItems->each(function ($item) use ($customerCoords) {
            $item->variant->inventoryStocks->filter(function ($stock) use ($item) {
                return $item->quantity <= $stock->quantity_available;
            })->sortBy(function ($stock) use ($customerCoords) {
                return $this->calculateHaversineDistance(
                    $customerCoords->lat,
                    $customerCoords->lon,
                    $stock->inventorable->coordinates()->lat,
                    $stock->inventorable->coordinates()->lon,
                );
            })->first()->inventorable;
        });
    }

    public function nearestHubWithStock(CartItem $selectedItem, Coordinate $customerCoords)
    {
        return $selectedItem->variant->inventoryStocks->filter(function ($stock) use ($selectedItem) {
            return $selectedItem->quantity <= $stock->quantity_available;
        })->sortBy(function ($stock) use ($customerCoords) {
            return $this->calculateHaversineDistance(
                $customerCoords->lat,
                $customerCoords->lon,
                $stock->inventorable->coordinates()->lat,
                $stock->inventorable->coordinates()->lon,
            );
        })->first()->inventorable;
    }

    /**
     * @param array<int, Coordinate> $coordsN
     */
    public function nearestFromMultipleLocations(Coordinate $coordsA, array $coordsN): int
    {
        $nearestId = null;
        $shortestDistance = PHP_FLOAT_MAX;

        foreach ($coordsN as $id => $coordsX) {
            $distanceKM = $this->calculateHaversineDistance(
                $coordsA->lat, 
                $coordsA->lon, 
                $coordsX->lat, 
                $coordsX->lon
            );

            if ($distanceKM < $shortestDistance) {
                $shortestDistance = $distanceKM;
                $nearestId = $id;
            }
        }

        return $nearestId;
    }

    public function getCoordinates(CustomerAddress|string $address, $attempts = 0): Coordinate|JsonResponse
    {
        $response = Http::withHeaders([
            'User-Agent' => 'EcommercePortfolioApp/1.0'
        ])->get('https://nominatim.openstreetmap.org/search', [
            'q' => is_string($address) ? $address : $address->fullAddress(),
            'format' => 'json',
            'limit' => 1,
        ]);

        if ($response->status() === 429) {
            return response()->json(['error' => 'Too many requests. Please try again later.'], 429);
        }

        if ($response->failed()) {
            throw new Exception('Failed to get coordinates.');
        }

        // base case for success
        if ($response->successful() && !empty($response->json())) {
            $data = $response->json()[0];

            return new Coordinate($data['lat'], $data['lon']);
        }
        
        // recursive case
        if ($attempts < 3) {
            return $this->getCoordinates($address->fullCityAddress(), $attempts + 1); 
        }

        // base case 2 for failure
        return response()->json(['error' => 'No available coordinates.']);
    }

    public function calculateHaversineDistance(float $lat1, float $lon1, float $lat2, float $lon2): float
    {
        $earthRadius = 6371; // Radius of earth in kilometers

        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);

        $a = sin($dLat / 2) * sin($dLat / 2) +
            cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
            sin($dLon / 2) * sin($dLon / 2);
            
        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadius * $c; // Distance in KM
    }
}