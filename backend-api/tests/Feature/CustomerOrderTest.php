<?php

use App\Models\Customer;

test('a customer can place its orders', function () {
        $customer = Customer::factory()->create();

    $this->actingAs($customer->user)
        ->postJson(route('orders.place'))
        ->asserCreated();
});