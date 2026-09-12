<?php

use App\Models\CartItem;
use App\Models\Customer;
use App\Models\CustomerAddress;
use App\Models\FulfillmentHub;
use App\Models\Product;
use App\Models\Vendor;
use App\Models\Warehouse;
use Database\Factories\Address\AddressFactory;
use Illuminate\Testing\Fluent\AssertableJson;

test('multiple selected item variants to multiple vendors are checked if which stock hubs is nearest to the customer\'s shipping address', function () {
    // NEXT
})->skip();

/**
 * MAKE SURE YOU ARE CONSIDERING THAT WHAT YOU HAVE BEEN DOING IS PART OF A CERTAIN SCENARIO FEATURE YOU WANT TO SHOWCASE IN YOUR PROJECT.
 * AI asks me: What happens if an item doesn't find a valid stock hub (i.e. $nearestHub returns null because items are out of stock everywhere)? Would you like me to show you how to write a quick validation rule to handle out-of-stock items before it hits the shipping calculators?
 */
test('multiple selected item variants are checked if which stock hubs is nearest to the customer\'s shipping address', function () {
    
    // -------------------------------------------------------------
    // Available Addresses
    // -------------------------------------------------------------
    // $address = AddressFactory::luzon('region_1', 1);
    // $address = AddressFactory::luzon('region_1', 2);
    // $address = AddressFactory::luzon('region_1', 3);
    // $address = AddressFactory::luzon('region_2', 1);
    // $address = AddressFactory::luzon('region_2', 2);
    // $address = AddressFactory::luzon('region_2', 3);
    // $address = AddressFactory::luzon('region_3', 1);
    // $address = AddressFactory::luzon('region_3', 2);
    // $address = AddressFactory::luzon('region_3', 3);

    // $address = AddressFactory::visayas('region_6', 1);
    // $address = AddressFactory::visayas('region_6', 2);
    // $address = AddressFactory::visayas('region_6', 3);
    // $address = AddressFactory::visayas('region_7', 1);
    // $address = AddressFactory::visayas('region_7', 2);
    // $address = AddressFactory::visayas('region_7', 3);
    // $address = AddressFactory::visayas('region_8', 1);
    // $address = AddressFactory::visayas('region_8', 2);
    // $address = AddressFactory::visayas('region_8', 3);

    // $address = AddressFactory::mindanao('region_9', 1);
    // $address = AddressFactory::mindanao('region_9', 2);
    // $address = AddressFactory::mindanao('region_9', 3);
    // $address = AddressFactory::mindanao('region_10', 1);
    // $address = AddressFactory::mindanao('region_10', 2);
    // $address = AddressFactory::mindanao('region_10', 3);
    // $address = AddressFactory::mindanao('region_11', 1);
    // $address = AddressFactory::mindanao('region_11', 2);
    // $address = AddressFactory::mindanao('region_11', 3);

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

    $payload = [
        'selected_items_id' => $cart->cartItems->pluck('id')
    ];

    $this->actingAs($customer->user, 'sanctum')
        ->postJson(route('checkouts.process'), $payload)
        ->assertOk()
        ->assertJson(fn (AssertableJson $json) => $json
            ->has('data.payment_methods', 7)
            ->where('data.payment_methods.0', 'paypal')
            ->where('data.payment_methods.1', 'stripe')
            ->where('data.payment_methods.2', 'gcash')
            ->where('data.payment_methods.3', 'paymaya')
            ->where('data.payment_methods.4', 'grabpay')
            ->where('data.payment_methods.5', 'shopeepay')
            ->where('data.payment_methods.6', 'qrph')
            ->has('data.checkout_items', 3)
            ->where('data.checkout_items.0.vendor_id', $vendorA->id)
            ->where('data.checkout_items.0.shop_name', $vendorA->shop_name)
            ->has('data.checkout_items.0.items', 2)
            ->has('data.checkout_items.0.items.0.variant')
            ->where('data.checkout_items.0.items.0.variant.id', $variantA->id)
            ->where('data.checkout_items.0.items.0.variant.sku', $variantA->sku)
            ->where('data.checkout_items.0.items.0.variant.price', bcdiv($variantA->price->getAmount(), 10000, 4))
            ->where('data.checkout_items.0.items.0.variant.actual_weight_kg', $variantA->actual_weight_kg)
            ->has('data.checkout_items.0.items.0.product')
            ->where('data.checkout_items.0.items.0.product.id', $variantA->product->id)
            ->where('data.checkout_items.0.items.0.product.name', $variantA->product->name)
            ->where('data.checkout_items.0.items.0.product.slug', $variantA->product->slug)
            ->where('data.checkout_items.0.items.0.product.description', $variantA->product->description)
            ->where('data.checkout_items.0.items.0.quantity', $variantA->cartItem->quantity)
            ->has('data.checkout_items.0.items.0.price_quantity')
            ->has('data.checkout_items.0.items.0.subtotal')
            ->has('data.checkout_items.0.items.0.shipping_fee_details')
            ->has('data.checkout_items.0.items.0.shipping_fee_details.baseRatings')
            ->has('data.checkout_items.0.items.0.shipping_fee_details.shippingFee')
            ->has('data.grand_total')
            ->etc()
        );
})->only();