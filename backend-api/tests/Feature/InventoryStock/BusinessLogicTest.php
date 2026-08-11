<?php

use App\Models\Variant;
use App\Models\Vendor;
use App\Models\Warehouse;

// test('multiple adjustments accumulate correctly and log separate ledgers', function () {
//     // 
// });

// test('stock record gets created during the product variant creation as initial stock', function () {
//     // 
// });

test('stock can be adjusted in a platform fulfillment hub', function () {

});

test('product variant can be created without specifying its stock', function () {
    $variant = Variant::factory()->create();

    expect($variant->inventoryStock()->get()->isEmpty())->toBeTrue();
});

test('a product variant stock can be adjusted', function () {
    $vendor = Vendor::factory()
        ->hasWarehouses(1)
        ->hasProducts(1)
        ->create();
    $warehouse = $vendor->warehouses->first();
    $product = $vendor->products->first();
    $variant = Variant::factory()
        ->for($product)
        ->create();

    $payload = [
        'facility_type' => 'warehouse',
        'facility_id' => $warehouse->id,
        'delta' => 50,
        'entry_type' => 'restock',
    ];

    $this->actingAs($variant->product->vendor->user, 'sanctum')
        ->postJson(route('inventory-stocks.store', $variant), $payload)
        ->assertCreated();

    $this->assertDatabaseHas('inventory_stocks', [
        'variant_id' => $variant->id,
        'inventorable_type' => Warehouse::class,
        'inventorable_id' => $warehouse->id,
        'quantity_available' => 50,
    ]);

    $stock = $variant->refresh()->inventoryStock->first();

    $this->assertDatabaseHas('inventory_ledgers', [
        'inventory_stock_id' => $stock->id,
        'user_id' => $vendor->user_id,
        'delta_quantity' => 50,
        'entry_type' => 'restock',
    ]);
});