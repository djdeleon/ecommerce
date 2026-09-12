<?php

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Customer;
use App\Models\User;
use Database\Factories\Address\AddressFactory;

test('a customer has a cart upon registration', function () {
    $user = User::factory()->make()->toArray();
    $userPassword = [
        'password' => 'secretPassword123',
        'password_confirmation' => 'secretPassword123',
    ];
    $payload = array_merge($user, $userPassword);

    $this->postJson(route('customers.register'), $payload)
        ->assertCreated();
    
    $registeredCustomer = User::where('name', $user['name'])->first()->customer;

    expect($registeredCustomer)->cart->toBeInstanceOf(Cart::class);
});

test('a customer can register without filling out an address', function () {
    $user = [
        'name'     => 'david',
        'email'    => 'customer@example.com',
        'password' => 'securePassword123'
    ];

    $response = $this->postJson(route('register'), $user);

    $response->assertCreated()
            ->assertJsonPath('message', 'Registration Successful.');

    $this->assertDatabaseHas('users', [
        'email' => $user['email']
    ]);

    $user = User::where('email', $user['email'])->first();
    expect($user->password)->not->toBe($user['email']);
});

test('a customer is required to add at least one address upon placing an order', function () {
    $customer = Customer::factory()->create();
    $cart = $customer->cart;

    CartItem::factory()->for($cart)->create();
    $cartItems = $cart->cartItems;

    $payload = [
        'order_details' => [
            'total_amount' => "100.00",
            'shipping_address' => '123 Main St',
        ],
        'order_items' => $cartItems,
        'payment_method' => 'paypal',
    ];

    $this->actingAs($customer->user, 'sanctum')
        ->postJson(route('orders.place'), $payload)
        ->assertJsonValidationErrors(['customer_address_id']);
});

test('a customer can have multiple address with full psgc addresses upon successful registration with Geolocation Coordinates', function () {
    $customer = Customer::factory()->create();

    $address = AddressFactory::luzon();

    $payload = [
        'detail_address' => [
            'recipient_name' => 'John Doe',
            'phone_number'   => '09171234567',
            'is_default'     => true,
            'label'          => 'Home',
        ],
        'address' => $address,
    ];

    $this->actingAs($customer->user, 'sanctum')
        ->postJson(route('customer-addresses.store'), $payload)
        ->assertCreated();

    $customer->refresh();

    expect($customer->customerAddresses)->toHaveCount(1);
    expect($customer->customerAddresses[0]->recipient_name)->toBe('John Doe');
    expect($customer->customerAddresses[0]->address)
        ->latitude->toBeString()
        ->longitude->toBeString();
})->skip();