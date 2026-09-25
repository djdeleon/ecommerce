<?php

namespace App\Services;

use App\DataObjects\Coordinate;
use App\Enums\OrderPackageStatus;
use App\Models\Customer;
use App\Models\OrderPackage;
use App\Models\Vendor;
use Exception;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

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

    public function toPickup(OrderPackage $orderPackage)
    {
        $response = Http::withToken(config('services.logistics.key'))
            ->patch("http://logistics:8000/jnt/parcels/{$orderPackage->id}/ready-for-pickup");

        if ($response->status() !== 200) {
            throw new Exception('Invalid shipment update.');
        }
    }

    public function ship(OrderPackage $orderPackage, Vendor $vendor, Customer $customer)
    {
        /**
         * The facility should be in the orderPackage as well for sender details
         */

        /**
         * Once the vendor set the warehouse configuration to 'pickup', this should already ping the J&T.
         * 
         * You might ask how the vendor will set the configuration for the warehouse?
         * - what I'm thinking is Laravel will send an api request with a payload containing the location to the Fastify
         * - This is doable since local branches are now having polygons and they are happy
         */

        $newPayload = [
            'merchant_details' => [
                'name' => 'Gadget Hub PH',
                'contact_number' => '+639171234567',
                'pickup_address' => [
                    'region' => 'Central Luzon',
                    'province' => 'Bulacan',
                    'city' => 'City of San Jose Del Monte',
                    'barangay' => 'San Manuel',
                    'full_address' => 'Bulacan, City of San Jose Del Monte, San Manuel, Garnet Street',
                    'coordinates' => [
                        'longitude' => "121.0673907",
                        'latitude' => "14.7787567",
                    ]
                ],
            ],
            'customer_details' => [
                'name' => 'John Doe',
                'contact_number' => '+639646875348',
                'email' => 'johndoe@email.com',
                'delivery_address' => [
                    'region' => 'Metro Manila',
                    'province' => '',
                    'city' => 'Quezon City',
                    'barangay' => 'Pinyahan',
                    'full_address' => 'Garnet Street, Barangay Pinyahan, Diliman, Quezon City, Metro Manila',
                    'coordinates' => [
                        'longitude' => "121.0468066",
                        'latitude' => "14.6411298",
                    ]
                ],
            ],
            'parcel_info' => [
                'weight_grams' => 1200,
                'length_cm' => 20.0,
                'width_cm' => 15.0,
                'height_cm' => 10.0,
                'item_description' => 'Wireless Mechanical Keyboard',
                'declared_value' => 1250.00
            ],

        ];

        $facility = $orderPackage->orderPackageItems[0]->orderPackageItemFacilities[0];
        $payload = [
            'external_order_id' => (string) $orderPackage->id,
            'store_name' => $facility->inventoryStock->inventorable->name,
            'store_contact_number' => $facility->inventoryStock->inventorable->contact_number,
            'store_address' => $facility->fullAddress(),
            'store_location' => new Coordinate(125.10, 14.42),
            'customer_name' => $customer->user->name,
            'customer_phone' => '09440857284', // column to be added
            'customer_address' => $customer->customerAddresses[0]->fullAddress(),
            'customer_location' => new Coordinate(124.00, 12.42),
            'weight_grams' => (int) $orderPackage->orderPackageItems[0]->variant->actual_weight_kg, // column to be added in orderPackageItem (snapshot)
        ];

        $camelCasePayload = collect($payload)->mapWithKeys(function ($value, $key) {
            return [Str::camel($key) => $value];
        })->all();

        $response = Http::withToken(config('services.logistics.key'))
            ->post('http://logistics:8000/jnt/parcels', $camelCasePayload);

        // The shipment id response can be stored in the order_package_statuses or creat a new table named order_package_shipment_logs

        // we can now do something like this (side-effects)
        // it is better to change it to ToReceive when the rider picks up the order package.
        // $orderPackage->orderPackagestatuses()->create([
        //     'changed_by_id' => $vendor->id,
        //     'status' => OrderPackageStatus::ToReceive,
        //     'notes' => 'Order is being shipped...',
        // ]);

        // $data = $response->json()['data'];

        // this one as well, we don't need this as this is already stored in Fastify, we can query this by providing the external_order_id => $orderPackage->id
        // $orderPackage->orderPackageShipment()->create([
        //     'shipment_id' => $data['externalOrderId'],
        //     'tracking_number' => $data['trackingNumber']
        // ]);

        // I remember this is already being taken care of on the Fastify side
        // this means we can make an api call providing the shipment_id
        // $orderPackage->orderPackageShipmentLogs()->create([
        //     'shipment_id' => $data['externalOrderId'],
        //     'status' => 'pending_pickup'
        // ]);

        // if we don't need to store anything, then we just need a confirmation if the request is success or fail

        if ($response->status() !== 201) {
            throw new Exception('Invalid shipment creation.');
        }
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