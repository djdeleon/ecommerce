<?php

use App\Models\FulfillmentHub;
use App\Models\InventoryStock;
use App\Models\Variant;
use App\Models\Warehouse;

test('facilities can reverse lookup their assigned inventory stock entries', function () {
    $warehouse = Warehouse::factory()->create();
    $hub = FulfillmentHub::factory()->create();

    InventoryStock::factory()
        ->count(3)
        ->for($warehouse, 'inventorable')
        ->create();
    InventoryStock::factory()
        ->count(2)
        ->for($hub, 'inventorable')
        ->create();

    expect($warehouse->refresh()->inventoryStocks)->toHaveCount(3)
        ->and($warehouse->inventoryStocks->first())->toBeInstanceOf(InventoryStock::class);

    expect($hub->refresh()->inventoryStocks)->toHaveCount(2)
        ->and($hub->inventoryStocks->first())->toBeInstanceOf(InventoryStock::class);
});

test('variant correctly retrieves all associated facility inventory record', function () {
    $variant = Variant::factory()->create();
    $warehouse = Warehouse::factory()->create();
    $hub = FulfillmentHub::factory()->create();

    InventoryStock::factory()
        ->for($variant)
        ->for($warehouse, 'inventorable')
        ->create(['quantity_available' => 10]);
        
    InventoryStock::factory()
        ->for($variant)
        ->for($hub, 'inventorable')
        ->create(['quantity_available' => 20]);

    
    $stocks = $variant->refresh()->inventoryStocks;

    expect($stocks)->toHaveCount(2)
        ->and($stocks->pluck('quantity_available')->toArray())->toEqualCanonicalizing([10, 20]);
});

test('inventory stock belongs to a variant', function () {
    $stock = InventoryStock::factory()->create();

    expect($stock->variant)->toBeInstanceOf(Variant::class);
});

test('inventory stock can polymorphically belongs to a warehouse', function () {
    $warehouse = Warehouse::factory()->create();
    $stock = InventoryStock::factory()->for($warehouse, 'inventorable')->create();

    expect($stock->inventorable)->toBeInstanceOf(Warehouse::class)
        ->and($stock->inventorable->id)->toBe($warehouse->id);
});

test('inventory stock can polymorphically belongs to a fulfillment hub', function () {
    $fulfillmentHub = FulfillmentHub::factory()->create();
    $stock = InventoryStock::factory()->for($fulfillmentHub, 'inventorable')->create();

    expect($stock->inventorable)->toBeInstanceOf(FulfillmentHub::class)
        ->and($stock->inventorable->id)->toBe($fulfillmentHub->id);
});