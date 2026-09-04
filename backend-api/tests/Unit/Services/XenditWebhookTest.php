<?php

use App\Enums\OrderPackagePaymentStatus;
use App\Enums\OrderPackageStatus;
use App\Models\Order;

test('stripe webhook successfully transitions payment and order items to paid state', function () {
    $order = Order::factory()->unpaid()->create();
    
    $xenditReferenceId = 'ORD-' . $order->id . '-MOCK';

    $order = OrderTestBuilder::order()
                ->packages()
                ->withItems()
                ->withStatuses()
                ->withPayments(attributes: [
                        'status' => OrderPackagePaymentStatus::Pending,
                        'transaction_reference' => $xenditReferenceId,
                    ])
                ->create();

    $payload = [
        'created' => '2026-09-01T18:46:31.898Z',
        'business_id' => '6a96a6c9b6944cd91cb75290',
        'event' => 'payment.capture',
        'api_version' => 'v3',
        'data' => [
            'type' => 'PAY',
            'status' => 'SUCCEEDED',
            'country' => 'PH',
            'created' => '2026-09-01T18:46:28.293Z',
            'updated' => '2026-09-01T18:46:31.005Z',
            'captures' => [
                [
                    'capture_id' => 'cptr-2cc743c3-04a9-4317-995e-18ac709327a2',
                    'capture_amount' => 250,
                    'capture_timestamp' => '2026-09-01T18:46:31.290Z'
                ]
            ],
            'currency' => 'PHP',
            'metadata' => [
                'metametadata' => 'metametametadata'
            ],
            'payment_id' => 'py-2cc743c3-04a9-4317-995e-18ac709327a2',
            'business_id' => '6a96a6c9b6944cd91cb75290',
            'channel_code' => 'GCASH',
            'reference_id' => $xenditReferenceId,
            'capture_method' => 'AUTOMATIC',
            'request_amount' => 250,
            'payment_details' => new \stdClass(),
            'payment_request_id' => 'pr-28ffcef8-7178-431c-8d5a-3b020bfbf9e3'
        ]
    ];

    $response = $this->postJson(route('xendit.webhook'), $payload);
    $response->assertOk();

    $orderPayment = $order->orderPackages[0]->orderPackagePayments[0];

    expect($orderPayment)
        ->payment_method->toBe('xendit')
        ->status->toBe(OrderPackagePaymentStatus::Completed)
        ->gateway_reference->toBe('cptr-2cc743c3-04a9-4317-995e-18ac709327a2');

    expect($order->orderPackages[0]->orderPackageStatuses[0]->status)->toBe(OrderPackageStatus::ToPay);
    expect($order->orderPackages[0]->getLatestOrderPackageStatus->status)->toBe(OrderPackageStatus::ToShip);
});