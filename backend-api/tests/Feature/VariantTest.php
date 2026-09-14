<?php

use App\Models\CartItem;
use App\Models\Customer;
use App\Models\CustomerAddress;
use App\Models\FulfillmentHub;
use App\Models\Product;
use App\Models\Variant;
use App\Models\Vendor;
use App\Models\Warehouse;
use App\Services\GeolocationService;
use Database\Factories\Address\AddressFactory;

test('a selected item variant is checked if which stock hubs is nearest to the customer\'s shipping address', function () {
    // -------------------------------------------------------------
    // Vendor
    // -------------------------------------------------------------
    $vendor = Vendor::factory()->create();

    // -------------------------------------------------------------
    // Vendor Warehouses (A, B, C)
    // -------------------------------------------------------------
    $warehouseA = $vendor->warehouses()->create([
        'name' => 'Warehouse A',
        'contact_number' => '09171234567',
    ]);
    $address = AddressFactory::luzon('region_1');
    $warehouseA->address()->create($address);

    $warehouseB = $vendor->warehouses()->create([
        'name' => 'Warehouse B',
        'contact_number' => '09171232227',
    ]);
    $address = AddressFactory::visayas('region_6');
    $warehouseB->address()->create($address);

    $warehouseC = $vendor->warehouses()->create([
        'name' => 'Warehouse C',
        'contact_number' => '09171231239',
    ]);
    $address = AddressFactory::mindanao('region_9');
    $warehouseC->address()->create($address);

    // -------------------------------------------------------------
    // Platform Fulfillment Hub (A, B, C)
    // -------------------------------------------------------------
    $address = AddressFactory::luzon('region_2');
    $hubA = FulfillmentHub::factory()->create();
    $hubA->address()->create($address);

    $address = AddressFactory::visayas('region_7');
    $hubB = FulfillmentHub::factory()->create();
    $hubB->address()->create($address);

    $address = AddressFactory::mindanao('region_10');
    $hubC = FulfillmentHub::factory()->create();
    $hubC->address()->create($address);

    // -------------------------------------------------------------
    // Vendor Product
    // -------------------------------------------------------------
    Product::factory()->hasVariants()->for($vendor)->create();

    // -------------------------------------------------------------
    // Vendor Product Variant Stock
    // -------------------------------------------------------------
    $variant = $vendor->products[0]->variants[0];
    $variant->inventoryStocks()->create([
        'inventorable_type' => Warehouse::class,
        'inventorable_id' => $warehouseA->id,
        'quantity_available' => 5,
        'quantity_reserved' => 0,
    ]);
    $variant->inventoryStocks()->create([
        'inventorable_type' => Warehouse::class,
        'inventorable_id' => $warehouseB->id,
        'quantity_available' => 10,
        'quantity_reserved' => 0,
    ]);
    $variant->inventoryStocks()->create([
        'inventorable_type' => Warehouse::class,
        'inventorable_id' => $warehouseC->id,
        'quantity_available' => 15,
        'quantity_reserved' => 0,
    ]);
    $variant->inventoryStocks()->create([
        'inventorable_type' => FulfillmentHub::class,
        'inventorable_id' => $hubA->id,
        'quantity_available' => 5,
        'quantity_reserved' => 0,
    ]);
    $variant->inventoryStocks()->create([
        'inventorable_type' => FulfillmentHub::class,
        'inventorable_id' => $hubB->id,
        'quantity_available' => 10,
        'quantity_reserved' => 0,
    ]);
    $variant->inventoryStocks()->create([
        'inventorable_type' => FulfillmentHub::class,
        'inventorable_id' => $hubC->id,
        'quantity_available' => 15,
        'quantity_reserved' => 0,
    ]);

    // -------------------------------------------------------------
    // Customer
    // -------------------------------------------------------------
    $customer = Customer::factory()->create();
    $customerAddress = CustomerAddress::factory()->for($customer)->create();
    $address = AddressFactory::luzon('region_3');
    $customerAddress->address()->create($address);

    // -------------------------------------------------------------
    // Customer Cart Item
    // -------------------------------------------------------------
    $cart = $customer->cart;
    $selectedItem = CartItem::factory()->for($cart)->for($variant)->create(['quantity' => 15]);

    $geolocationService = new GeolocationService();
    $stockHub = $geolocationService->nearestHubWithStock($selectedItem, $customerAddress->coordinates());

    expect($stockHub->address->region->slug)->toBe('region_10');
});

test('a variant can be stocked in different warehouses and fulfillment hubs', function () {
    // -------------------------------------------------------------
    // Vendor
    // -------------------------------------------------------------
    $vendor = Vendor::factory()->create();

    // -------------------------------------------------------------
    // Vendor Warehouses (A, B, C)
    // -------------------------------------------------------------
    $warehouseA = $vendor->warehouses()->create([
        'name' => 'Warehouse A',
        'contact_number' => '09171234567',
    ]);
    $address = AddressFactory::luzon('region_1');
    $warehouseA->address()->create($address);

    $warehouseB = $vendor->warehouses()->create([
        'name' => 'Warehouse B',
        'contact_number' => '09171232227',
    ]);
    $address = AddressFactory::visayas('region_6');
    $warehouseB->address()->create($address);

    $warehouseC = $vendor->warehouses()->create([
        'name' => 'Warehouse C',
        'contact_number' => '09171231239',
    ]);
    $address = AddressFactory::mindanao('region_9');
    $warehouseC->address()->create($address);

    // -------------------------------------------------------------
    // Platform Fulfillment Hub (A, B, C)
    // -------------------------------------------------------------
    $address = AddressFactory::luzon('region_2');
    $hubA = FulfillmentHub::factory()->create();
    $hubA->address()->create($address);

    $address = AddressFactory::visayas('region_7');
    $hubB = FulfillmentHub::factory()->create();
    $hubB->address()->create($address);

    $address = AddressFactory::mindanao('region_10');
    $hubC = FulfillmentHub::factory()->create();
    $hubC->address()->create($address);

    // -------------------------------------------------------------
    // Vendor Product
    // -------------------------------------------------------------
    Product::factory()->hasVariants()->for($vendor)->create();

    // -------------------------------------------------------------
    // Vendor Product Variant Stock
    // -------------------------------------------------------------
    $variant = $vendor->products[0]->variants[0];
    $variant->inventoryStocks()->create([
        'inventorable_type' => Warehouse::class,
        'inventorable_id' => $warehouseA->id,
        'quantity_available' => 5,
        'quantity_reserved' => 0,
    ]);
    $variant->inventoryStocks()->create([
        'inventorable_type' => Warehouse::class,
        'inventorable_id' => $warehouseB->id,
        'quantity_available' => 10,
        'quantity_reserved' => 0,
    ]);
    $variant->inventoryStocks()->create([
        'inventorable_type' => Warehouse::class,
        'inventorable_id' => $warehouseC->id,
        'quantity_available' => 15,
        'quantity_reserved' => 0,
    ]);
    $variant->inventoryStocks()->create([
        'inventorable_type' => FulfillmentHub::class,
        'inventorable_id' => $hubA->id,
        'quantity_available' => 5,
        'quantity_reserved' => 0,
    ]);
    $variant->inventoryStocks()->create([
        'inventorable_type' => FulfillmentHub::class,
        'inventorable_id' => $hubB->id,
        'quantity_available' => 10,
        'quantity_reserved' => 0,
    ]);
    $variant->inventoryStocks()->create([
        'inventorable_type' => FulfillmentHub::class,
        'inventorable_id' => $hubC->id,
        'quantity_available' => 15,
        'quantity_reserved' => 0,
    ]);

    expect($variant->inventoryStocks)->toHaveCount(6);
});

test('a product can have variants', function () {
    $product = Product::factory()->create();
    $payload = [
        'product_id' => $product->id,
        'sku' => $product->name . '-sku',
        'price' => 100.00
    ];

    $this->actingAs($product->vendor->user, 'sanctum')
        ->postJson(route('variants.store', $product), $payload)
        ->assertCreated();
});

test('creating a producting variant with same SKU is not allowed', function () {
    $variantA = Variant::factory()->create();
    $variantB = [
        'product_id' => $variantA->product->id,
        'sku' => $variantA->sku,
        'price' => 100.00,
    ];

    $this->actingAs($variantA->product->vendor->user, 'sanctum')
        ->postJson(route('variants.store', $variantA->product), $variantB)
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['sku']);
});

test('variant price maintains high precision price decimal 4 without rounding errors', function () {
    $product = Product::factory()->create();
    $highPrecisionPrice = 99.9876;
    
    $payload = [
        'product_id' => $product->id,
        'sku' => $product->name . '-sku',
        'price' => $highPrecisionPrice
    ];

    $this->actingAs($product->vendor->user, 'sanctum')
        ->postJson(route('variants.store', $product), $payload)
        ->assertCreated();

    $variant = $product->variants->first();

    expect((string) $variant->getRawOriginal('price'))->toBe('99.9876');

    expect($variant->price->getAmount())->toBe('999876');
});

it('it validates required fields when creating a variant', function () {
    $product = Product::factory()->create();

    $this->actingAs($product->vendor->user, 'sanctum')
        ->postJson(route('variants.store', $product), [])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['sku', 'price']);
});

it('prevents negative prices', function () {
    $product = Product::factory()->create();

    $payload = [
        'sku' => 'VAR->NEG-1',
        'price' => -10.00,
    ];

    $this->actingAs($product->vendor->user, 'sanctum')
        ->postJson(route('variants.store', $product), $payload)
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['price']);
});

it('prevents non-numeric prices', function () {
    $product = Product::factory()->create();

    $payload = [
        'sku' => 'VAR->NEG-1',
        'price' => 'invalid-price',
    ];

    $this->actingAs($product->vendor->user, 'sanctum')
        ->postJson(route('variants.store', $product), $payload)
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['price']);
});