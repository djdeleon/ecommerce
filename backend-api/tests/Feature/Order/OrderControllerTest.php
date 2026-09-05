<?php

use App\Enums\OrderPackagePaymentStatus;
use App\Enums\OrderPackageStatus;
use App\Models\Order;
use App\Models\User;
use App\Models\Vendor;
use Spatie\Permission\Models\Role;

/**
 * Test Cases base from Order Transition
 */

test('ToReturn Order Package can proceed to Returned', function () {
    $order = Order::factory()->toReturn()->create();
    $orderPackage = $order->orderPackages[0];

    $this->actingAs($orderPackage->vendor->user, 'sanctum')
        ->postJson(route('orders.vendor.returned', $orderPackage))
        ->assertOk();

    $orderPackage->refresh();

    expect($orderPackage->orderPackageStatuses)->toHaveCount(5);
    expect($orderPackage->orderPackageStatuses[0]->status)->toBe(OrderPackageStatus::ToPay);
    expect($orderPackage->orderPackageStatuses[1]->status)->toBe(OrderPackageStatus::ToShip);
    expect($orderPackage->orderPackageStatuses[2]->status)->toBe(OrderPackageStatus::ToReceive);
    expect($orderPackage->orderPackageStatuses[3]->status)->toBe(OrderPackageStatus::ToReturn);
    expect($orderPackage->getLatestOrderPackageStatus->status)->toBe(OrderPackageStatus::Returned);
});

test('ToReturn Order Package can proceed to Rejected', function () {
    $order = Order::factory()->toReturn()->create();
    $orderPackage = $order->orderPackages[0];

    $this->actingAs($orderPackage->vendor->user, 'sanctum')
        ->postJson(route('orders.vendor.rejected', $orderPackage))
        ->assertOk();

    $orderPackage->refresh();

    expect($orderPackage->orderPackageStatuses)->toHaveCount(5);
    expect($orderPackage->orderPackageStatuses[0]->status)->toBe(OrderPackageStatus::ToPay);
    expect($orderPackage->orderPackageStatuses[1]->status)->toBe(OrderPackageStatus::ToShip);
    expect($orderPackage->orderPackageStatuses[2]->status)->toBe(OrderPackageStatus::ToReceive);
    expect($orderPackage->orderPackageStatuses[3]->status)->toBe(OrderPackageStatus::ToReturn);
    expect($orderPackage->getLatestOrderPackageStatus->status)->toBe(OrderPackageStatus::Rejected);
});

describe('ToReceive Order can transition to Completed and ToReturn', function () {
    test('ToReceive Order can proceed to Completed', function () {
        $order = Order::factory()->toReceive()->create();

        $this->actingAs($order->customer->user, 'sanctum')
            ->postJson(route('orders.completed', $order))
            ->assertOk();

        $order->refresh();

        $order->orderPackages->each(function ($package) {
            expect($package->getLatestOrderPackageStatus->status)->toBe(OrderPackageStatus::Completed);
            expect($package->orderPackageStatuses)->toHaveCount(4);
        });
    });

    /**
     * A customer can request the orderPackage to return, BUT the vendor is the one going to mark the orderPackage as Returned.
     */
    test('ToReceive Order Package can proceed to ToReturn', function () {
        $order = Order::factory()->toReceive()->create();
        $orderPackage = $order->orderPackages[0];

        $this->actingAs($order->customer->user, 'sanctum')
            ->postJson(route('orders.to-return', $orderPackage))
            ->assertOk();

        $orderPackage->refresh();

        expect($orderPackage->orderPackageStatuses)->toHaveCount(4);
        expect($orderPackage->orderPackageStatuses[0]->status)->toBe(OrderPackageStatus::ToPay);
        expect($orderPackage->orderPackageStatuses[1]->status)->toBe(OrderPackageStatus::ToShip);
        expect($orderPackage->orderPackageStatuses[2]->status)->toBe(OrderPackageStatus::ToReceive);
        expect($orderPackage->getLatestOrderPackageStatus->status)->toBe(OrderPackageStatus::ToReturn);
    });
});

test('ToShip Order Package can proceed to ToReceive', function () {
    $order = Order::factory()->paid()->create();
    $orderPackage = $order->orderPackages[0];
    
    $this->actingAs($orderPackage->vendor->user, 'sanctum')
        ->postJson(route('orders.vendor.to-receive', $orderPackage))
        ->assertOk();

    $orderPackage->refresh();

    expect($orderPackage->orderPackageStatuses)->toHaveCount(3);
    expect($orderPackage->orderPackageStatuses[0]->status)->toBe(OrderPackageStatus::ToPay);
    expect($orderPackage->orderPackageStatuses[1]->status)->toBe(OrderPackageStatus::ToShip);
    expect($orderPackage->getLatestOrderPackageStatus->status)->toBe(OrderPackageStatus::ToReceive);
});

/**
 * We can cancel by order OR order package
 * - a customer can cancel its order
 * - - ALL packages in the order will be cancelled, since the customer pays for the entire packages in one payment.
 * 
 * - a vendor can cancel an order package
 */
describe('order cancellation', function () {
    test('a vendor can cancel its order package', function () {
        $order = Order::factory()->paid()->create();
        $orderPackage = $order->orderPackages[0];
        
        $this->actingAs($orderPackage->vendor->user, 'sanctum')
            ->postJson(route('orders.vendor.cancel', $orderPackage))
            ->assertOk();
        
        $orderPackage->refresh();
        
        expect($orderPackage->orderPackagePayments)->toHaveCount(2);
        expect($orderPackage->orderPackagePayments[0]->status)->toBe(OrderPackagePaymentStatus::Completed);
        expect($orderPackage->getLatestOrderPackagePayment->status)->toBe(OrderPackagePaymentStatus::Refunded);
        
        expect($orderPackage->orderPackageItems)->toHaveCount(1);
    });

    test('a customer can cancel its to_ship paid orders', function () {
        $order = Order::factory()->paid()->create();
        $orderPackage = $order->orderPackages[0];

        $this->actingAs($order->customer->user, 'sanctum')
            ->postJson(route('orders.customer.cancel', $order))
            ->assertOk();

        $order->refresh();

        expect($orderPackage->orderPackagePayments)->toHaveCount(2);
        expect($orderPackage->getLatestOrderPackagePayment->status)->toBe(OrderPackagePaymentStatus::Refunded);
        
        expect($orderPackage->orderPackageItems)->toHaveCount(1);
    });

    test('a customer can cancel its to_pay unpaid orders', function () {
        $order = Order::factory()->unpaid()->create();
        $orderPackage = $order->orderPackages[0];

        $this->actingAs($order->customer->user, 'sanctum')
            ->postJson(route('orders.customer.cancel', $order))
            ->assertOk();

        $order->refresh();

        expect($orderPackage->orderPackagePayments)->toHaveCount(1);
        expect($orderPackage->getLatestOrderPackagePayment->status)->toBe(OrderPackagePaymentStatus::Failed);
        
        expect($orderPackage->orderPackageItems)->toHaveCount(1);
    });
});