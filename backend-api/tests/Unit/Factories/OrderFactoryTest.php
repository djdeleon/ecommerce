<?php

use App\Enums\OrderPackageStatus;
use App\Enums\OrderPackagePaymentStatus;
use App\Models\Order;

test('order factory toPay state correctly creates item in ToPay status with delegated records', function () {
    $order = OrderTestBuilder::order()
                            ->packages()
                            ->withitems()
                            ->toPay();

    $orderPackage = $order->orderPackages[0];

    expect($orderPackage->orderPackagePayments)->toHaveCount(1);
    expect($orderPackage->getLatestOrderPackagePayment->status)->toBe(OrderPackagePaymentStatus::Pending);

    expect($orderPackage->orderPackageItems)->toHaveCount(1);

    expect($orderPackage->orderPackageStatuses)->toHaveCount(1);
    expect($orderPackage->getLatestOrderPackageStatus->status)->toBe(OrderPackageStatus::ToPay);
});

test('order factory toShip state correctly creates item in ToShip status', function () {
    $order = OrderTestBuilder::order()
                            ->packages()
                            ->withitems()
                            ->toShip();

    $orderPackage = $order->orderPackages[0];

    expect($orderPackage->orderPackagePayments)->toHaveCount(1);
    expect($orderPackage->getLatestOrderPackagePayment->status)->toBe(OrderPackagePaymentStatus::Completed);

    expect($orderPackage->orderPackageItems)->toHaveCount(1);

    expect($orderPackage->orderPackageStatuses)->toHaveCount(2);
    expect($orderPackage->orderPackageStatuses[0]->status)->toBe(OrderPackageStatus::ToPay);
    expect($orderPackage->getLatestOrderPackageStatus->status)->toBe(OrderPackageStatus::ToShip);
});