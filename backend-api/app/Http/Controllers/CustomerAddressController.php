<?php

namespace App\Http\Controllers;

use App\DataObjects\Coordinate;
use App\Http\Requests\CreateCustomerAddressRequest;
use App\Models\EntityAddress;
use App\Services\GeolocationService;
use App\Traits\HttpResponses;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Http;

class CustomerAddressController extends Controller
{
    use HttpResponses;

    public function store(CreateCustomerAddressRequest $request, GeolocationService $geolocationService): JsonResponse
    {
        $customer = $request->user()->customer;
        $data = $request->validated();

        $customerAddress = $customer->customerAddresses()->create($data['detail_address']);
        $address = $customerAddress->address()->create($data['address']);

        /**
         * This is where we can do the Forward Geocoding
         * - only compute when the customer address creation is successful
         */

        $coords = $geolocationService->getCoordinates($customerAddress);

        if ($coords instanceof Coordinate) {
            $address->latitude = $coords->lat;
            $address->longitude = $coords->lon;
            $address->save();
            
            return $this->success(
                $customerAddress,
                'Customer Address created.',
                201
            );
        }

        return $this->success(
            $customerAddress,
            'Customer Address created.',
            201
        );
    }

    protected function fallbackToCity(EntityAddress $customerAddress)
    {
        $fallbackAddress = "{$customerAddress->city->name}, {$customerAddress->province->name}, {$customerAddress->region->name} Philippines";

        $response = Http::withHeaders([
            'User-Agent' => 'EcommercePortfolioApp/1.0' // Required by Nominatim policy
        ])->get('https://nominatim.openstreetmap.org/search', [
            'q' => $fallbackAddress,
            'format' => 'json',
            'limit' => 1,
        ]);

        if ($response->successful() && !empty($response->json())) {
            $data = $response->json()[0];
            $customerAddress->latitude = (float) $data['lat'];
            $customerAddress->longitude = (float) $data['lon'];
            $customerAddress->save();
        }

        return null;
    }
}
