<?php

use App\Models\Order;
use App\Services\Payments\XenditService;

test('xendit sandbox integration create payment request', function () {
    $order = Order::factory()
        ->toPay(1, 'gcash')
        ->create([
            'total_amount' => 120.50,
        ]);
    
    $xenditService = new XenditService();
    $paymentRequest = $xenditService->createPaymentRequest($order, 'gcash');

    dump($paymentRequest);

    expect($paymentRequest)->toHaveKeys(['payment_request_id', 'status', 'channel_code', 'type', 'actions']);
});