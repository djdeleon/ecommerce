<?php

use App\Models\CartItem;
use App\Models\Customer;
use App\Models\Product;
use App\Models\Vendor;
use Illuminate\Testing\Fluent\AssertableJson;

test('a customer can checkout its selected items', function () {
    $customer = Customer::factory()->create();
    $cart = $customer->cart;

    $vendors = Vendor::factory(3)->create();
    $vendorA = $vendors[0];
    $vendorAProductA = Product::factory()->hasVariants(['price' => 100])->for($vendorA)->create();
    $vendorAProductB = Product::factory()->hasVariants(['price' => 100])->for($vendorA)->create();
    $vendorAProductC = Product::factory()->hasVariants(['price' => 100])->for($vendorA)->create();

    $vendorB = $vendors[1];
    $vendorBProductA = [
        Product::factory()->hasVariants(['price' => 100])->for($vendorB)->create(),
        Product::factory()->hasVariants(['price' => 100])->for($vendorB)->create(),
    ];


    $vendorC = $vendors[2];
    $vendorCProductA = Product::factory()->hasVariants(['price' => 100])->for($vendorC)->create();

    CartItem::factory()->for($cart)->create(['variant_id' => $vendorAProductA->variants[0]->id, 'quantity' => 1]);
    CartItem::factory()->for($cart)->create(['variant_id' => $vendorAProductB->variants[0]->id, 'quantity' => 1]);
    CartItem::factory()->for($cart)->create(['variant_id' => $vendorAProductC->variants[0]->id, 'quantity' => 1]);
    CartItem::factory()->for($cart)->create(['variant_id' => $vendorBProductA[0]->id, 'quantity' => 1]);
    CartItem::factory()->for($cart)->create(['variant_id' => $vendorBProductA[1]->id, 'quantity' => 1]);
    CartItem::factory()->for($cart)->create(['variant_id' => $vendorCProductA->variants[0]->id, 'quantity' => 1]);

    $payload = [
        'selected_items' => [
            $vendorAProductA->variants[0]->id,
            $vendorAProductB->variants[0]->id,
            $vendorAProductC->variants[0]->id,
            $vendorBProductA[0]->id,
            $vendorBProductA[1]->id,
            $vendorCProductA->variants[0]->id,
        ],
    ];

    $response = $this->actingAs($customer->user, 'sanctum')
        ->postJson(route('checkouts.store'), $payload);

    $response->assertStatus(200);

    $response->assertJson(fn (AssertableJson $json) => $json
        ->has('data.checkout_items', 3) // Ensures we have exactly 3 vendor items
        ->where('data.checkout_items.0.vendor_id', $vendorA->id)
        ->where('data.checkout_items.0.shop_name', $vendorA->shop_name)
        ->where('data.checkout_items.0.merchant.merchant_total', '300.00')
        ->has('data.checkout_items.0.merchant.merchant_items', 3)
        
        ->where('data.checkout_items.1.vendor_id', $vendorB->id)
        ->where('data.checkout_items.1.shop_name', $vendorB->shop_name)
        ->where('data.checkout_items.1.merchant.merchant_total', '200.00')
        ->has('data.checkout_items.1.merchant.merchant_items', 2)

        ->where('data.checkout_items.2.vendor_id', $vendorC->id)
        ->where('data.checkout_items.2.shop_name', $vendorC->shop_name)
        ->where('data.checkout_items.2.merchant.merchant_total', '100.00')
        ->has('data.checkout_items.2.merchant.merchant_items', 1)

        ->has('data.payment_methods', fn ($json) => $json->whereAll(['Paypal', 'Stripe']))
        ->where('data.payment_details.grand_total', '600.00')
        ->etc()
    );
});