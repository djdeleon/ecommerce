<?php

use App\Enums\OrderItemStatus;
use App\Enums\OrderPaymentStatus;
use App\Models\Order;

test('order factory toPay state correctly creates item in ToPay status with delegated records', function () {
    $order = Order::factory()
        ->toPay(2)
        ->create();

    expect($order->orderPayments)->toHaveCount(1);
    expect($order->latestOrderPayment->status)->toBe(OrderPaymentStatus::Pending);

    expect($order->orderItems)->toHaveCount(2);

    $order->orderItems->each(function ($orderItem) {
        expect($orderItem->orderItemStatuses)->toHaveCount(1);
        expect($orderItem->orderItemStatuses->first()->status)->toBe(OrderItemStatus::ToPay);
    });
});

test('order factory toShip state correctly creates item in ToShip status', function () {
    $order = Order::factory()
        ->toShip(2)
        ->create();

    expect($order->orderPayments)->toHaveCount(1);
    expect($order->latestOrderPayment->status)->toBe(OrderPaymentStatus::Completed);

    expect($order->orderItems)->toHaveCount(2);

    $order->orderItems->each(function ($orderItem) {
        expect($orderItem->orderItemStatuses)->toHaveCount(2);
        expect($orderItem->orderItemStatuses[0]->status)->toBe(OrderItemStatus::ToPay);
        expect($orderItem->latestOrderItemStatus->status)->toBe(OrderItemStatus::ToShip);
    });
});