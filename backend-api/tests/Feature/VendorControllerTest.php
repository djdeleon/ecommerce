<?php

use App\Models\FulfillmentHub;
use App\Models\Order;
use Database\Factories\Address\AddressFactory;

test('a vendor can arrange a shipment for ToShip Order', function () {
    $order = Order::factory()->paid()->create();
    $orderPackage = $order->orderPackages[0];
    $orderPackage->shipping_address = "Poblacion Broad, City of Cabanatuan, Nueva Ecija, Central Luzon (Region III), Philippines";
    $orderPackage->save();

    $orderPackageItem = $orderPackage->orderPackageItems[0];
    $variant = $orderPackageItem->variant;

    $address = AddressFactory::mindanao('region_9', 1);
    $hub = FulfillmentHub::factory()->create();
    $hub->address()->create($address);

    $variant->inventoryStocks()->create([
        'inventorable_type' => FulfillmentHub::class,
        'inventorable_id' => $hub->id,
        'quantity_available' => 10,
        'quantity_reserved' => 0,
    ]);

    $orderPackageItem->orderPackageItemFacilities()->create([
        'facility_id' => $orderPackageItem->variant->inventoryStocks[0]->id,
    ]);

    $vendor = $orderPackage->vendor;

    $this->actingAs($vendor->user, 'sanctum')
        ->postJson(route('vendors.arrange-shipment', $orderPackage))
        ->assertOk();
})->only();