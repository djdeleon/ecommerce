<?php

use App\Enums\OrderPackagePaymentStatus;
use App\Enums\OrderPackageStatus;

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
    expect(OrderPackageStatus::ToPay->canTransitionWithPayment(OrderPackageStatus::ToShip, OrderPackagePaymentStatus::Completed, 'system'))->toBeTrue();
    expect(OrderPackageStatus::ToPay->canTransitionWithPayment(OrderPackageStatus::Cancelled, OrderPackagePaymentStatus::Pending, 'customer'))->toBeTrue();
    expect(OrderPackageStatus::ToPay->canTransitionWithPayment(OrderPackageStatus::Cancelled, OrderPackagePaymentStatus::Authorized, 'customer'))->toBeTrue();
    expect(OrderPackageStatus::ToPay->canTransitionWithPayment(OrderPackageStatus::Cancelled, OrderPackagePaymentStatus::Failed, 'customer'))->toBeTrue();

    expect(OrderPackageStatus::ToShip->canTransitionWithPayment(OrderPackageStatus::ToReceive, OrderPackagePaymentStatus::Completed, 'vendor'))->toBeTrue();
    expect(OrderPackageStatus::ToShip->canTransitionWithPayment(OrderPackageStatus::Rejected, OrderPackagePaymentStatus::Completed, 'vendor'))->toBeTrue();
    expect(OrderPackageStatus::ToShip->canTransitionWithPayment(OrderPackageStatus::Cancelled, OrderPackagePaymentStatus::Completed, 'customer'))->toBeTrue();

    expect(OrderPackageStatus::ToReceive->canTransitionWithPayment(OrderPackageStatus::Completed, OrderPackagePaymentStatus::Completed, 'customer'))->toBeTrue();
    expect(OrderPackageStatus::ToReceive->canTransitionWithPayment(OrderPackageStatus::Completed, OrderPackagePaymentStatus::Completed, 'system'))->toBeTrue();
    expect(OrderPackageStatus::ToReceive->canTransitionWithPayment(OrderPackageStatus::Returned, OrderPackagePaymentStatus::Completed, 'vendor'))->toBeTrue();
});


// For Factory (Arrange) into Route (Act)
// THIS IS NOT ONLY PERTAINING TO THE STATE TEST, THIS IS FEATURE TEST
test('a customer with a paid order can cancel the order and be refunded', function () {
    $order = OrderTestBuilder::order()
        ->packages()
        ->withItems()
        ->toShip();

    $this->actingAs($order->customer->user, 'sanctum')
        ->postJson(route('orders.customer.cancel', $order))
        ->assertOk();
    
    $orderPackage = $order->orderPackages[0];

    expect($orderPackage->orderPackageItems)->toHaveCount(1);
    expect($orderPackage->getLatestOrderPackageStatus->status)->toBe(OrderPackageStatus::Cancelled);

    expect($orderPackage->orderPackagePayments)->toHaveCount(2);
    expect($orderPackage->orderPackagePayments[0]->status)->toBe(OrderPackagePaymentStatus::Completed);
    expect($orderPackage->getLatestOrderPackagePayment->status)->toBe(OrderPackagePaymentStatus::Refunded);
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