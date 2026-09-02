<?php

use App\Enums\OrderItemStatus;
use App\Enums\OrderPaymentStatus;
use App\Models\Order;

test('order factory toPay state correctly creates item in TO_PAY status with delegated records', function () {
    $order = Order::factory()
        ->toPay(2)
        ->create();

    expect($order->orderPayments)->toHaveCount(1);
    expect($order->latestOrderPayment->status)->toBe(OrderPaymentStatus::PENDING);

    expect($order->orderItems)->toHaveCount(2);

    $order->orderItems->each(function ($orderItem) {
        expect($orderItem->orderItemStatuses)->toHaveCount(1);
        expect($orderItem->orderItemStatuses->first()->status)->toBe(OrderItemStatus::TO_PAY);
    });
});

test('order factory toShip state correctly creates item in TO_SHIP status', function () {
    $order = Order::factory()
        ->toShip(2)
        ->create();

    expect($order->orderPayments)->toHaveCount(1);
    expect($order->latestOrderPayment->status)->toBe(OrderPaymentStatus::COMPLETED);

    expect($order->orderItems)->toHaveCount(2);

    $order->orderItems->each(function ($orderItem) {
        expect($orderItem->orderItemStatuses)->toHaveCount(2);
        expect($orderItem->orderItemStatuses[0]->status)->toBe(OrderItemStatus::TO_PAY);
        expect($orderItem->latestOrderItemStatus->status)->toBe(OrderItemStatus::TO_SHIP);
    });
});