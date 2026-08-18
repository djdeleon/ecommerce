<?php

use App\Models\Cart;
use App\Models\Customer;
use App\Models\Variant;

test('a customer can add items into the cart', function () {
    $customer = Customer::factory()->create();

    $variants = Variant::factory(3)->create();

    $payload = [
        'variant_id' => $variants->first()->id,
        'quantity' => 5,
    ];

    $this->actingAs($customer->user)
        ->postJson(route('carts.store'), $payload)
        ->assertCreated();
})->only();

test('a customer can have many cart items', function () {
    $customer = Customer::factory()->create();
    Cart::factory(3)->for($customer)->create();

    expect($customer->carts->count())->toBe(3);
})->only();