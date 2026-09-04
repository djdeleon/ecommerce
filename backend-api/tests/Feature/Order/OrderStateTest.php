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
//     'cannot ship a pending order'    => [OrderStatus::Pending, 'orders.ship'],
//     'cannot cancel a delivered order' => [OrderStatus::DELIVERED, 'orders.cancel'],
//     'cannot pay a cancelled order'   => [OrderStatus::Cancelled, 'orders.pay'],
// ]);

test('validation of cross-domain order item transitions with payment status and actors', function () {
    expect(OrderItemStatusEnum::ToPay->canTransitionWithPayment(OrderItemStatusEnum::ToShip, OrderPaymentStatus::Completed, 'system'))->toBeTrue();
    expect(OrderItemStatusEnum::ToPay->canTransitionWithPayment(OrderItemStatusEnum::Cancelled, OrderPaymentStatus::Pending, 'customer'))->toBeTrue();
    expect(OrderItemStatusEnum::ToPay->canTransitionWithPayment(OrderItemStatusEnum::Cancelled, OrderPaymentStatus::Authorized, 'customer'))->toBeTrue();
    expect(OrderItemStatusEnum::ToPay->canTransitionWithPayment(OrderItemStatusEnum::Cancelled, OrderPaymentStatus::Failed, 'customer'))->toBeTrue();

    expect(OrderItemStatusEnum::ToShip->canTransitionWithPayment(OrderItemStatusEnum::ToReceive, OrderPaymentStatus::Completed, 'vendor'))->toBeTrue();
    expect(OrderItemStatusEnum::ToShip->canTransitionWithPayment(OrderItemStatusEnum::Rejected, OrderPaymentStatus::Completed, 'vendor'))->toBeTrue();
    expect(OrderItemStatusEnum::ToShip->canTransitionWithPayment(OrderItemStatusEnum::Cancelled, OrderPaymentStatus::Completed, 'customer'))->toBeTrue();

    expect(OrderItemStatusEnum::ToReceive->canTransitionWithPayment(OrderItemStatusEnum::Completed, OrderPaymentStatus::Completed, 'customer'))->toBeTrue();
    expect(OrderItemStatusEnum::ToReceive->canTransitionWithPayment(OrderItemStatusEnum::Completed, OrderPaymentStatus::Completed, 'system'))->toBeTrue();
    expect(OrderItemStatusEnum::ToReceive->canTransitionWithPayment(OrderItemStatusEnum::Returned, OrderPaymentStatus::Completed, 'vendor'))->toBeTrue();
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
        expect($orderItem->latestOrderItemStatus->status)->toBe(OrderItemStatusEnum::Cancelled);
    });

    expect($order->orderPayments)->toHaveCount(2);
    expect($order->latestOrderPayment->status)->toBe(OrderPaymentStatus::Failed);
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