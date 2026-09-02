<?php

use App\Services\Payments\PaymentServiceFactory;
use App\Services\Contracts\PaymentServiceInterface;
use App\Services\Payments\PaypalService;
use App\Services\Payments\StripeService;
use App\Services\Payments\XenditService;

dataset('payment_gateways', [
    ['paypal', PaypalService::class],
    ['stripe', StripeService::class],
    ['gcash', XenditService::class],
    ['paymaya', XenditService::class],
    ['grabpay', XenditService::class],
    ['shopeepay', XenditService::class],
    ['qrph', XenditService::class],
]);

test('payment service factory resolves supported gateways correctly from the container', function (string $method, string $expectedClass) {
    $factory = app(PaymentServiceFactory::class);

    $service = $factory->make($method);

    expect($service)
        ->toBeInstanceOf($expectedClass)
        ->toBeInstanceOf(PaymentServiceInterface::class);
        
})->with('payment_gateways')->only();

test('payment service factory throws exception for unsupported gateway methods', function () {
    $factory = app(PaymentServiceFactory::class);

    expect(fn () => $factory->make('invalid_gateway'))
        ->toThrow(InvalidArgumentException::class, 'Payment gateway [invalid_gateway] is not supported.');
})->only();
