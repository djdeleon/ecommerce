<?php

use App\Models\Order;
use App\Services\Payments\StripeService;

test('stripe sandbox integration create payment intent', function () {
    $order = OrderTestBuilder::order()
                            ->packages()
                            ->toPay('stripe');

    $stripeService = new StripeService();
    $paymentIntent = $stripeService->createPaymentIntent($order);

    expect($paymentIntent)->toBeArray();
    expect($paymentIntent)->toHaveKeys(['id', 'client_secret']);

    expect($paymentIntent['id'])
        ->toBeString()
        ->toStartWith('pi_');

    expect($paymentIntent['client_secret'])
        ->toBeString()
        ->toStartWith('pi_')
        ->toContain('_secret_');
});