<?php

use App\Models\Customer;
use App\Models\Order;
use App\Models\OrderItem;

test('an order item can be shipped', function () {
    $orderItems = OrderItem::factory(3)->create();
    $orderItemA = $orderItems[0];
    $orderItemB = $orderItems[1];
    $orderItemC = $orderItems[2];

    $order = $orderItemA->order;
    $customer = $order->customer;

    // dd($order, $customer);

    $this->actingAs($customer->user, 'sanctum')
        ->postJson(route('shipments.store'))
        ->assertCreated();
});