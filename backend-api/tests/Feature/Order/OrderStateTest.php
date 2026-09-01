<?php

use App\Enums\OrderItemStatus as OrderItemStatusEnum;
use App\Enums\OrderPaymentStatus;
use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderItemStatus;
use App\Models\OrderPayment;

// Test ILLEGAL States, NOT the legal. Legal is already being handled when we do the Factory into Route Test Cases Below
// test('blocks invalid order state transitions', function (OrderStatus $initialState, string $actionRoute) {
//     // 1. Arrange: Create order in initial state using factory state
//     $order = Order::factory()->state(['status' => $initialState])->create();

//     // 2. Act: Try illegal transition
//     $this->actingAs($order->customer->user, 'sanctum')
//         ->postJson(route($actionRoute, $order))
//         ->assertUnprocessable();

//     // 3. Assert: Status remains unchanged
//     expect($order->fresh()->status)->toBe($initialState);
// })->with([
//     'cannot ship a pending order'    => [OrderStatus::PENDING, 'orders.ship'],
//     'cannot cancel a delivered order' => [OrderStatus::DELIVERED, 'orders.cancel'],
//     'cannot pay a cancelled order'   => [OrderStatus::CANCELLED, 'orders.pay'],
// ]);

test('validation of cross-domain order item transitions with payment status and actors', function () {
    expect(OrderItemStatusEnum::TO_PAY->canTransitionWithPayment(OrderItemStatusEnum::TO_SHIP, OrderPaymentStatus::COMPLETED, 'system'))->toBeTrue();
    expect(OrderItemStatusEnum::TO_PAY->canTransitionWithPayment(OrderItemStatusEnum::CANCELLED, OrderPaymentStatus::PENDING, 'customer'))->toBeTrue();
    expect(OrderItemStatusEnum::TO_PAY->canTransitionWithPayment(OrderItemStatusEnum::CANCELLED, OrderPaymentStatus::AUTHORIZED, 'customer'))->toBeTrue();
    expect(OrderItemStatusEnum::TO_PAY->canTransitionWithPayment(OrderItemStatusEnum::CANCELLED, OrderPaymentStatus::FAILED, 'customer'))->toBeTrue();

    expect(OrderItemStatusEnum::TO_SHIP->canTransitionWithPayment(OrderItemStatusEnum::TO_RECEIVE, OrderPaymentStatus::COMPLETED, 'vendor'))->toBeTrue();
    expect(OrderItemStatusEnum::TO_SHIP->canTransitionWithPayment(OrderItemStatusEnum::REJECTED, OrderPaymentStatus::COMPLETED, 'vendor'))->toBeTrue();
    expect(OrderItemStatusEnum::TO_SHIP->canTransitionWithPayment(OrderItemStatusEnum::CANCELLED, OrderPaymentStatus::COMPLETED, 'customer'))->toBeTrue();

    expect(OrderItemStatusEnum::TO_RECEIVE->canTransitionWithPayment(OrderItemStatusEnum::COMPLETED, OrderPaymentStatus::COMPLETED, 'customer'))->toBeTrue();
    expect(OrderItemStatusEnum::TO_RECEIVE->canTransitionWithPayment(OrderItemStatusEnum::COMPLETED, OrderPaymentStatus::COMPLETED, 'system'))->toBeTrue();
    expect(OrderItemStatusEnum::TO_RECEIVE->canTransitionWithPayment(OrderItemStatusEnum::RETURNED, OrderPaymentStatus::COMPLETED, 'vendor'))->toBeTrue();
});


// For Factory (Arrange) into Route (Act)
// THIS IS NOT ONLY PERTAINING TO THE STATE TEST, THIS IS FEATURE TEST
test('a customer with a paid order can cancel the order and be refunded', function () {
    $order = Order::factory()
        ->toShip(2)
        ->create();

    $this->actingAs($order->customer->user, 'sanctum')
        ->postJson(route('orders.cancel', $order))
        ->assertOk();
    
    $order->fresh();

    expect($order->orderItems)->toHaveCount(2);
    $order->orderItems->each(function ($orderItem) {
        expect($orderItem->latestOrderItemStatus->status)->toBe(OrderItemStatusEnum::CANCELLED);
    });

    expect($order->orderPayments)->toHaveCount(2);
    expect($order->latestOrderPayment->status)->toBe(OrderPaymentStatus::REFUNDED);
});

// For Factory (Arrange) into Route (Act)
// test('transitioning order to shipped automatically creates a core shipment record', function () {
//     // Pre-condition state
//     $order = Order::factory()->processing()->withItems(1)->create();

//     // Trigger state change action
//     $this->actingAs($vendorUser, 'sanctum')
//         ->postJson(route('vendor.orders.ship', $order))
//         ->assertOk();

//     // Assert Post-condition state
//     expect($order->fresh()->status)->toBe(OrderStatus::SHIPPED);

//     // Assert Side-effect (User Story #47!)
//     $this->assertDatabaseHas('shipments', [
//         'order_item_id' => $order->orderItems->first()->id,
//         'current_status' => 'pending',
//     ]);
// });