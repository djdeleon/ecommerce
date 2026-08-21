<?php

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Customer;
use App\Models\User;
use App\Models\Variant;
use Illuminate\Testing\Fluent\AssertableJson;

test('a customer has a cart upon registration', function () {
    $user = User::factory()->make()->toArray();
    $userPassword = [
        'password' => 'secretPassword123',
        'password_confirmation' => 'secretPassword123',
    ];
    $customer = [
        'shipping_address' => '123 Main Garnet St.'
    ];
    $payload = array_merge($user, $userPassword, $customer);

    $this->postJson(route('customers.register'), $payload)
        ->assertCreated();
    
    $registeredCustomer = User::where('name', $user['name'])->first()->customer;

    expect($registeredCustomer)
        ->shipping_address->toBe($customer['shipping_address'])
        ->cart->toBeInstanceOf(Cart::class);
});

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
            ->where('data.customer.shipping_address', $customer->shipping_address)
            ->where('data.cart_items.0.id', $customerCartItemA->id)
            ->where('data.cart_items.1.id', $customerCartItemB->id)
            ->where('data.cart_items.2.id', $customerCartItemC->id)
        );
});