<?php

namespace App\Services;

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
            ->patch("http://logistics:8000/jnt/shipments/{$orderPackage->id}/ready-for-pickup");

        if ($response->status() !== 200) {
            throw new Exception('Invalid shipment update.');
        }
    }

    public function ship(OrderPackage $orderPackage, Vendor $vendor, Customer $customer)
    {
        /**
         * The facility should be in the orderPackage as well for sender details
         */
        $facility = $orderPackage->orderPackageItems[0]->orderPackageItemFacilities[0];
        $payload = [
            'external_order_id' => (string) $orderPackage->id,
            'provider_name' => 'jnt',
            'sender_name' => $facility->inventoryStock->inventorable->name,
            'sender_phone_number' => $facility->inventoryStock->inventorable->contact_number,
            'sender_address' => $facility->fullAddress(),
            'recipient_name' => $customer->user->name,
            'recipient_phone_number' => '09440857284', // column to be added
            'recipient_address' => $customer->customerAddresses[0]->fullAddress(),
            'weight_kg' => $orderPackage->orderPackageItems[0]->variant->actual_weight_kg, // column to be added in orderPackageItem (snapshot)
        ];

        $camelCasePayload = collect($payload)->mapWithKeys(function ($value, $key) {
            return [Str::camel($key) => $value];
        })->all();

        $response = Http::withToken(config('services.logistics.key'))
            ->post('http://logistics:8000/jnt/shipments', $camelCasePayload);

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