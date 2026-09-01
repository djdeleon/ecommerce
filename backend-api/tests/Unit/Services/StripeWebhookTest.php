<?php

use App\Enums\OrderItemStatus as EnumsOrderItemStatus;
use App\Enums\OrderPaymentStatus;
use App\Models\Order;
use App\Models\OrderPayment;
use App\Services\Payments\StripeService;
use Illuminate\Support\Facades\Http;
use Stripe\Event;

test('stripe webhook successfully transitions payment and order items to paid state', function () {
    $order = Order::factory()
        ->toPay(2)
        ->create();

    $paymentIntentId = 'pl_test_mock_12345';
    $orderPayment = OrderPayment::factory()->for($order)->create([
        'status' => OrderPaymentStatus::PENDING,
        'transaction_reference' => $paymentIntentId,
    ]);

    $payload = [
        'id' => 'evt_test_webhook_123',
        'type' => 'payment_intent.succeeded',
        'data' => [
            'object' => [
                'id' => $paymentIntentId,
                'latest_charge' => 'ch_mock_charge_999',
            ]
        ]
    ];

    Http::fake();
    $this->mock(StripeService::class, function ($mock) use ($payload) {
        $mock->shouldReceive('verifyWebhook')
            ->once()
            ->andReturn(Event::constructFrom($payload));
    });

    $response = $this->postJson(route('stripe.webhook'), $payload, [
        'Stripe-Signature' => 'mocked_signature_header'
    ]);
    $response->assertOk();

    $orderPayment->refresh();

    expect($orderPayment)
        ->status->toBe(OrderPaymentStatus::COMPLETED)
        ->gateway_reference->toBe('ch_mock_charge_999');

    $order->orderItems->each(function ($orderItem) {
        expect($orderItem->orderItemStatuses)->toHaveCount(2);
        expect($orderItem->latestOrderItemStatus->status)->toBe(EnumsOrderItemStatus::TO_SHIP);
    });
});