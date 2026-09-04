<?php

use App\Models\Order;
use App\Services\Payments\XenditService;

test('xendit sandbox integration create payment request', function () {
    $method = 'gcash';

    $order = OrderTestBuilder::order()
                            ->packages()
                            ->toPay($method);
    
    $xenditService = new XenditService();
    $paymentRequest = $xenditService->createPaymentRequest($order, $method);

    expect($paymentRequest)->toHaveKeys(['payment_request_id', 'status', 'channel_code', 'type', 'actions']);
});