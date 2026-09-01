<?php

use App\Enums\OrderItemStatus as OrderItemStatusEnum;
use App\Enums\OrderPaymentStatus;
use App\Models\Order;
use App\Models\OrderPayment;

test('stripe webhook successfully transitions payment and order items to paid state', function () {
    $order = Order::factory()
        ->toPay(2)
        ->create();

    $xenditReferenceId = 'ORD-' . $order->id . '-MOCK';
    $orderPayment = OrderPayment::factory()->for($order)->create([
        'status' => OrderPaymentStatus::PENDING,
        'transaction_reference' => $xenditReferenceId,
    ]);

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

    $orderPayment->refresh();

    expect($orderPayment)
        ->payment_method->toBe('xendit')
        ->status->toBe(OrderPaymentStatus::COMPLETED)
        ->gateway_reference->toBe('cptr-2cc743c3-04a9-4317-995e-18ac709327a2');

    $order->orderItems->each(function ($orderItem) {
        expect($orderItem->orderItemStatuses)->toHaveCount(2);
        expect($orderItem->latestOrderItemStatus->status)->toBe(OrderItemStatusEnum::TO_SHIP);
    });
})->only();