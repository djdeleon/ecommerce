<?php

use App\Models\FulfillmentHub;
use App\Models\Variant;
use App\Models\Vendor;
use App\Models\Warehouse;

test('stock record gets created during the product variant creation as initial stock', function () {
    $vendor = Vendor::factory()->hasWarehouses(1)->hasProducts(1)->create();
    $product = $vendor->products->first();
    $warehouse = $vendor->warehouses->first();

    $payload = [
        'sku' => 'TSHIRT-RED-MED',
        'price' => 19.99,
        // Optional initial stock payload
        'initial_stock' => [
            'facility_type' => 'warehouse',
            'facility_id' => $warehouse->id,
            'delta' => 100,
        ]
    ];

    $this->actingAs($vendor->user, 'sanctum')
        ->postJson(route('variants.store', $product), $payload)
        ->assertCreated();
    
    $this->assertDatabaseHas('variants', ['sku' => 'TSHIRT-RED-MED']);

    $this->assertDatabaseHas('inventory_stocks', [
        'quantity_available' => 100,
        'inventorable_id' => $warehouse->id,
        'inventorable_type' => Warehouse::class,
    ]);

    $this->assertDatabaseHas('inventory_ledgers', [
        'delta_quantity' => 100,
        'entry_type' => 'restock'
    ]);
});

test('multiple adjustments accumulate correctly and log separate ledgers', function () {
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

    $this->actingAs($variant->product->vendor->user, 'sanctum')
        ->postJson(route('inventory-stocks.store', $variant), array_merge($payload, ['delta' => 20]))
        ->assertCreated();

    $this->actingAs($variant->product->vendor->user, 'sanctum')
        ->postJson(route('inventory-stocks.store', $variant), array_merge($payload, ['delta' => 30]))
        ->assertCreated();
    
    $this->assertDatabaseHas('inventory_stocks', [
        'variant_id' => $variant->id,
        'inventorable_type' => Warehouse::class,
        'inventorable_id' => $warehouse->id,
        'quantity_available' => 100,
    ]);

    $stock = $variant->refresh()->inventoryStocks->first();

    expect($stock->inventoryLedgers)->toHaveCount(3);
    expect($stock->inventoryLedgers->pluck('delta_quantity')->toArray())->toEqualCanonicalizing([50, 20, 30]);
});

test('stock can be adjusted in a platform fulfillment hub', function () {
    $vendor = Vendor::factory()
        ->hasWarehouses(1)
        ->hasProducts(1)
        ->create();
    $product = $vendor->products->first();
    $variant = Variant::factory()
        ->for($product)
        ->create();
    
    $fulfillmentHub = FulfillmentHub::factory()->create();

    $payload = [
        'facility_type' => 'fulfillment_hub',
        'facility_id' => $fulfillmentHub->id,
        'delta' => 50,
        'entry_type' => 'restock',
    ];

    $this->actingAs($variant->product->vendor->user, 'sanctum')
        ->postJson(route('inventory-stocks.store', $variant), $payload)
        ->assertCreated();

    $this->assertDatabaseHas('inventory_stocks', [
        'variant_id' => $variant->id,
        'inventorable_type' => FulfillmentHub::class,
        'inventorable_id' => $fulfillmentHub->id,
        'quantity_available' => 50,
    ]);

    $stock = $variant->refresh()->inventoryStocks->first();

    $this->assertDatabaseHas('inventory_ledgers', [
        'inventory_stock_id' => $stock->id,
        'user_id' => $vendor->user_id,
        'delta_quantity' => 50,
        'entry_type' => 'restock',
    ]);
});

test('product variant can be created without specifying its stock', function () {
    $variant = Variant::factory()->create();

    expect($variant->inventoryStocks()->get()->isEmpty())->toBeTrue();
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

    $stock = $variant->refresh()->inventoryStocks->first();

    $this->assertDatabaseHas('inventory_ledgers', [
        'inventory_stock_id' => $stock->id,
        'user_id' => $vendor->user_id,
        'delta_quantity' => 50,
        'entry_type' => 'restock',
    ]);
});