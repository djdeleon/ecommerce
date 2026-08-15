<?php

use App\Models\FulfillmentHub;
use App\Models\InventoryStock;
use App\Models\Product;
use App\Models\User;
use App\Models\Variant;
use App\Models\Vendor;
use App\Models\Warehouse;

test('a vendor can view a complete and strictly isolated stock control tree', function () {
    $vendor1 = Vendor::factory()->hasWarehouses(1, ['address' => 'Vendor 1 Warehouse'])->create();
    $vendor2 = Vendor::factory()->hasWarehouses(1, ['address' => 'Secret Competitor Warehouse'])->create();

    $product1 = Product::factory()->for($vendor1)->create(['name' => 'Vendor 1 Product']);
    $variant1 = Variant::factory()->for($product1)->create(['sku' => 'SKU-V1']);
    
    InventoryStock::factory()->for($variant1)->create([
        'inventorable_type' => Warehouse::class,
        'inventorable_id' => $vendor1->warehouses->first()->id,
        'quantity_available' => 50,
        'quantity_reserved' => 5,
    ]);

    $product2 = Product::factory()->for($vendor2)->create(['name' => 'Hidden Competitor Product']);
    $variant2 = Variant::factory()->for($product2)->create(['sku' => 'SKU-V2-PRIVATE']);
    
    InventoryStock::factory()->for($variant2)->create([
        'inventorable_type' => Warehouse::class,
        'inventorable_id' => $vendor2->warehouses->first()->id,
        'quantity_available' => 999,
    ]);

    $response = $this->actingAs($vendor1->user, 'sanctum')
        ->getJson(route('inventory-stocks.index'))
        ->assertOk();

    $response->assertJsonFragment(['name' => 'Vendor 1 Product'])
             ->assertJsonFragment(['sku' => 'SKU-V1'])
             ->assertJsonFragment(['quantity_available' => 50])
             ->assertJsonFragment(['address' => 'Vendor 1 Warehouse']);

    $response->assertJsonMissing(['name' => 'Hidden Competitor Product'])
             ->assertJsonMissing(['sku' => 'SKU-V2-PRIVATE'])
             ->assertJsonMissing(['address' => 'Secret Competitor Warehouse'])
             ->assertJsonMissing(['quantity_available' => 999]);

    $response->assertJsonCount(1, 'data.data');
});

test('an admin can visit the global inventory stock dashboard and view all vendor stocks', function () {
    $vendor1 = Vendor::factory()->hasWarehouses(1)->create();
    $vendor2 = Vendor::factory()->hasWarehouses(1)->create();

    $product1 = Product::factory()->for($vendor1)->hasVariants(1)->create();
    $product2 = Product::factory()->for($vendor2)->hasVariants(1)->create();

    InventoryStock::factory()->for($product1->variants->first())->create([
        'inventorable_type' => Warehouse::class,
        'inventorable_id' => $vendor1->warehouses->first()->id,
        'quantity_available' => 50,
    ]);

    InventoryStock::factory()->for($product2->variants->first())->create([
        'inventorable_type' => Warehouse::class,
        'inventorable_id' => $vendor2->warehouses->first()->id,
        'quantity_available' => 75,
    ]);

    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $this->actingAs($admin, 'sanctum')
        ->getJson(route('inventory-stocks.index'))
        ->assertOk()
        ->assertJsonCount(2, 'data.data')
        ->assertJsonFragment(['name' => $product1->name])
        ->assertJsonFragment(['name' => $product2->name])
        ->assertJsonFragment(['quantity_available' => 50])
        ->assertJsonFragment(['quantity_available' => 75]);
});

test('fulfilling reserved stocks decrements the quantity reserved without affecting the quantity available', function () {
    $stock = InventoryStock::factory()->create([
        'quantity_available' => 100,
        'quantity_reserved' => 0,
    ]);

    $stock->reserveStock(10);

    expect($stock->fresh())
        ->quantity_available->toBe(90)
        ->quantity_reserved->toBe(10);

    $stock->fulfillReservedStock(10);

    expect($stock->fresh())
        ->quantity_available->toBe(90)
        ->quantity_reserved->toBe(0);

    expect($stock->fresh()->inventoryLedgers->last())
        ->inventory_stock_id->toBe($stock->id)
        ->delta_quantity->toBe(-10)
        ->entry_type->toBe('fulfillment');
});

test('releasing reserved stock correctly restores quantity available and decreases quantity reserved', function () {
    $stock = InventoryStock::factory()->create([
        'quantity_available' => 100,
        'quantity_reserved' => 0,
    ]);

    $stock->reserveStock(10);

    expect($stock->fresh())
        ->quantity_available->toBe(90)
        ->quantity_reserved->toBe(10);

    $stock->releaseStock(10);

    expect($stock->fresh())
        ->quantity_available->toBe(100)
        ->quantity_reserved->toBe(0);

    expect($stock->fresh()->inventoryLedgers->last())
        ->inventory_stock_id->toBe($stock->id)
        ->delta_quantity->toBe(10)
        ->entry_type->toBe('release');
});

test('reserving available stock automatically reduces the available quantity', function () {
    $stock = InventoryStock::factory()->create([
        'quantity_available' => 100,
        'quantity_reserved' => 0,
    ]);

    $stock->reserveStock(5);

    expect($stock->inventoryLedgers->first())
        ->inventory_stock_id->toBe($stock->id)
        ->delta_quantity->toBe(-5)
        ->entry_type->toBe('reservation');

    expect($stock)
        ->quantity_available->toBe(95)
        ->quantity_reserved->toBe(5);
});

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