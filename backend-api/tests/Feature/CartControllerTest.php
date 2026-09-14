<?php

use App\Models\CartItem;
use App\Models\Customer;
use App\Models\CustomerAddress;
use App\Models\FulfillmentHub;
use App\Models\Product;
use App\Models\Variant;
use App\Models\Vendor;
use App\Models\Warehouse;
use Database\Factories\Address\AddressFactory;
use Illuminate\Testing\Fluent\AssertableJson;

test('a customer can select items in its cart with total amount and shipping fee', function () { // can add product discount and shipping discount later
    // -------------------------------------------------------------
    // Platform Fulfillment Hub (A, B, C)
    // -------------------------------------------------------------
    $hubA = FulfillmentHub::factory()->create();
    $address = AddressFactory::luzon('region_1', 1);
    $hubA->address()->create($address);

    $address = AddressFactory::visayas('region_6', 1);
    $hubB = FulfillmentHub::factory()->create();
    $hubB->address()->create($address);

    $address = AddressFactory::mindanao('region_9', 1);
    $hubC = FulfillmentHub::factory()->create();
    $hubC->address()->create($address);

    // -------------------------------------------------------------
    // Vendor A
    // -------------------------------------------------------------
    $vendorA = Vendor::factory()->create();

    // -------------------------------------------------------------
    // Vendor A Warehouses (A, B, C)
    // -------------------------------------------------------------
    $warehouseA = $vendorA->warehouses()->create([
        'name' => 'Warehouse A',
        'contact_number' => '09171234567',
    ]);
    $address = AddressFactory::luzon('region_1', 2);
    $warehouseA->address()->create($address);

    $warehouseB = $vendorA->warehouses()->create([
        'name' => 'Warehouse B',
        'contact_number' => '09171232227',
    ]);
    $address = AddressFactory::visayas('region_6', 2);
    $warehouseB->address()->create($address);

    $warehouseC = $vendorA->warehouses()->create([
        'name' => 'Warehouse C',
        'contact_number' => '09171231239',
    ]);
    $address = AddressFactory::mindanao('region_9', 2);
    $warehouseC->address()->create($address);

    // -------------------------------------------------------------
    // Vendor A Product
    // -------------------------------------------------------------
    Product::factory()->hasVariants(2)->for($vendorA)->create();

    // -------------------------------------------------------------
    // Vendor A Product Variant Stock
    // -------------------------------------------------------------
    $variantA = $vendorA->products[0]->variants[0];

    $variantA->inventoryStocks()->create([
        'inventorable_type' => Warehouse::class,
        'inventorable_id' => $warehouseA->id,
        'quantity_available' => 5,
        'quantity_reserved' => 0,
    ]);
    $variantA->inventoryStocks()->create([
        'inventorable_type' => Warehouse::class,
        'inventorable_id' => $warehouseB->id,
        'quantity_available' => 10,
        'quantity_reserved' => 0,
    ]);
    $variantA->inventoryStocks()->create([
        'inventorable_type' => Warehouse::class,
        'inventorable_id' => $warehouseC->id,
        'quantity_available' => 15,
        'quantity_reserved' => 0,
    ]);
    $variantA->inventoryStocks()->create([
        'inventorable_type' => FulfillmentHub::class,
        'inventorable_id' => $hubA->id,
        'quantity_available' => 5,
        'quantity_reserved' => 0,
    ]);
    $variantA->inventoryStocks()->create([
        'inventorable_type' => FulfillmentHub::class,
        'inventorable_id' => $hubB->id,
        'quantity_available' => 10,
        'quantity_reserved' => 0,
    ]);
    $variantA->inventoryStocks()->create([
        'inventorable_type' => FulfillmentHub::class,
        'inventorable_id' => $hubC->id,
        'quantity_available' => 15,
        'quantity_reserved' => 0,
    ]);

    $variantAA = $vendorA->products[0]->variants[1];

    $variantAA->inventoryStocks()->create([
        'inventorable_type' => Warehouse::class,
        'inventorable_id' => $warehouseA->id,
        'quantity_available' => 5,
        'quantity_reserved' => 0,
    ]);
    $variantAA->inventoryStocks()->create([
        'inventorable_type' => FulfillmentHub::class,
        'inventorable_id' => $hubC->id,
        'quantity_available' => 15,
        'quantity_reserved' => 0,
    ]);

    // -------------------------------------------------------------
    // Vendor B
    // -------------------------------------------------------------
    $vendorB = Vendor::factory()->create();

    // -------------------------------------------------------------
    // Vendor B Warehouses (A, B, C)
    // -------------------------------------------------------------
    $warehouseA = $vendorB->warehouses()->create([
        'name' => 'Warehouse D',
        'contact_number' => '09171222567',
    ]);
    $address = AddressFactory::luzon('region_1', 3);
    $warehouseA->address()->create($address);

    $warehouseB = $vendorB->warehouses()->create([
        'name' => 'Warehouse E',
        'contact_number' => '09172232227',
    ]);
    $address = AddressFactory::visayas('region_6', 3);
    $warehouseB->address()->create($address);

    $warehouseC = $vendorB->warehouses()->create([
        'name' => 'Warehouse F',
        'contact_number' => '09172231239',
    ]);
    $address = AddressFactory::mindanao('region_9', 3);
    $warehouseC->address()->create($address);

    // -------------------------------------------------------------
    // Vendor B Product
    // -------------------------------------------------------------
    Product::factory()->hasVariants()->for($vendorB)->create();

    // -------------------------------------------------------------
    // Vendor B Product Variant Stock
    // -------------------------------------------------------------
    $variantB = $vendorB->products[0]->variants[0];

    $variantB->inventoryStocks()->create([
        'inventorable_type' => Warehouse::class,
        'inventorable_id' => $warehouseA->id,
        'quantity_available' => 5,
        'quantity_reserved' => 0,
    ]);
    $variantB->inventoryStocks()->create([
        'inventorable_type' => Warehouse::class,
        'inventorable_id' => $warehouseB->id,
        'quantity_available' => 10,
        'quantity_reserved' => 0,
    ]);
    $variantB->inventoryStocks()->create([
        'inventorable_type' => Warehouse::class,
        'inventorable_id' => $warehouseC->id,
        'quantity_available' => 15,
        'quantity_reserved' => 0,
    ]);
    $variantB->inventoryStocks()->create([
        'inventorable_type' => FulfillmentHub::class,
        'inventorable_id' => $hubA->id,
        'quantity_available' => 5,
        'quantity_reserved' => 0,
    ]);
    $variantB->inventoryStocks()->create([
        'inventorable_type' => FulfillmentHub::class,
        'inventorable_id' => $hubB->id,
        'quantity_available' => 10,
        'quantity_reserved' => 0,
    ]);
    $variantB->inventoryStocks()->create([
        'inventorable_type' => FulfillmentHub::class,
        'inventorable_id' => $hubC->id,
        'quantity_available' => 15,
        'quantity_reserved' => 0,
    ]);

    // -------------------------------------------------------------
    // Vendor C
    // -------------------------------------------------------------
    $vendorC = Vendor::factory()->create();

    // -------------------------------------------------------------
    // Vendor C Warehouses (A, B, C)
    // -------------------------------------------------------------
    $warehouseA = $vendorC->warehouses()->create([
        'name' => 'Warehouse G',
        'contact_number' => '09171634567',
    ]);
    $address = AddressFactory::luzon('region_2', 1);
    $warehouseA->address()->create($address);

    $warehouseB = $vendorC->warehouses()->create([
        'name' => 'Warehouse H',
        'contact_number' => '09171232327',
    ]);
    $address = AddressFactory::visayas('region_7', 1);
    $warehouseB->address()->create($address);

    $warehouseC = $vendorC->warehouses()->create([
        'name' => 'Warehouse I',
        'contact_number' => '09121231239',
    ]);
    $address = AddressFactory::mindanao('region_10', 1);
    $warehouseC->address()->create($address);

    // -------------------------------------------------------------
    // Vendor C Product
    // -------------------------------------------------------------
    Product::factory()->hasVariants()->for($vendorC)->create();

    // -------------------------------------------------------------
    // Vendor C Product Variant Stock
    // -------------------------------------------------------------
    $variantC = $vendorC->products[0]->variants[0];
    $variantC->actual_weight_kg = 2;
    $variantC->package_height_cm = 20;
    $variantC->package_length_cm = 20;
    $variantC->package_width_cm = 30;
    $variantC->save();

    $variantC->inventoryStocks()->create([
        'inventorable_type' => Warehouse::class,
        'inventorable_id' => $warehouseA->id,
        'quantity_available' => 5,
        'quantity_reserved' => 0,
    ]);
    $variantC->inventoryStocks()->create([
        'inventorable_type' => Warehouse::class,
        'inventorable_id' => $warehouseB->id,
        'quantity_available' => 10,
        'quantity_reserved' => 0,
    ]);
    $variantC->inventoryStocks()->create([
        'inventorable_type' => Warehouse::class,
        'inventorable_id' => $warehouseC->id,
        'quantity_available' => 15,
        'quantity_reserved' => 0,
    ]);
    $variantC->inventoryStocks()->create([
        'inventorable_type' => FulfillmentHub::class,
        'inventorable_id' => $hubA->id,
        'quantity_available' => 5,
        'quantity_reserved' => 0,
    ]);
    $variantC->inventoryStocks()->create([
        'inventorable_type' => FulfillmentHub::class,
        'inventorable_id' => $hubB->id,
        'quantity_available' => 10,
        'quantity_reserved' => 0,
    ]);
    $variantC->inventoryStocks()->create([
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
    $address = AddressFactory::luzon('region_3', 3);
    $customerAddress->address()->create($address);
    $customerZone = $customerAddress->address->region->zone;

    // -------------------------------------------------------------
    // Customer Cart Items
    // -------------------------------------------------------------
    $cart = $customer->cart;
    CartItem::factory()->for($cart)->for($variantA)->create(['quantity' => 8]);
    CartItem::factory()->for($cart)->for($variantAA)->create(['quantity' => 15]);
    CartItem::factory()->for($cart)->for($variantB)->create(['quantity' => 10]);
    CartItem::factory()->for($cart)->for($variantC)->create(['quantity' => 5]);
})->skip();

test('a customer can add items into the cart', function () {
    $customer = Customer::factory()->create();

    $variants = Variant::factory(3)->create();
    $variantA = $variants->first();

    $payload = [
        'variant_id' => $variantA->id,
        'quantity' => 5,
    ];

    $this->actingAs($customer->user)
        ->postJson(route('cart-items.store'), $payload)
        ->assertCreated();

    expect($customer->cart->cartItems->first())
        ->variant_id->toBe($variantA->id)
        ->quantity->toBe($payload['quantity']);
});

test('customers can view their cart items', function () {
    $customer = Customer::factory()->create();
    $cart = $customer->cart; 
    CartItem::factory(3)->for($customer->cart)->create();
    $customerCartItemA = $cart->cartItems->first();
    $customerCartItemB = $cart->cartItems->skip(1)->first();
    $customerCartItemC = $cart->cartItems->skip(2)->first();

    $this->actingAs($customer->user, 'sanctum')
        ->getJson(route('carts.index'))
        ->assertOk()
        ->assertJson(fn (AssertableJson $json) => $json
            ->has('message')
            ->has('data.cart_items', 3)
            ->where('data.id', $cart->id)
            ->where('data.customer_id', $customer->id)
            ->where('data.cart_items.0.id', $customerCartItemA->id)
            ->where('data.cart_items.1.id', $customerCartItemB->id)
            ->where('data.cart_items.2.id', $customerCartItemC->id)
        );
});