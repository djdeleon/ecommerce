<?php

use App\Models\Order;

test('a vendor can arrange a shipment for ToShip Order', function () {
    $order = Order::factory()->paid()->create();
    $orderPackage = $order->orderPackages[0];
    $vendor = $orderPackage->vendor;

    $this->actingAs($vendor->user, 'sanctum')
        ->postJson(route('vendors.arrange-shipment', $orderPackage))
        ->assertOk();
});