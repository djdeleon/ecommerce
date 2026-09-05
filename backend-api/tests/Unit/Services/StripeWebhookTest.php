<?php

use App\Enums\OrderPackagePaymentStatus;
use App\Enums\OrderPackageStatus;
use App\Services\Payments\StripeService;
use Illuminate\Support\Facades\Http;
use Stripe\Event;

test('stripe webhook successfully transitions payment and order items to paid state', function () {
    $order = OrderTestBuilder::order()
                ->packages()
                ->withItems()
                ->withStatuses()
                ->withPayments(attributes: [
                        'payment_method' => 'stripe',
                        'status' => OrderPackagePaymentStatus::Pending,
                        'transaction_reference' => function ($order) {
                            return 'pl_' . $order->id . '_test_mock_12345';
                        },
                    ])
                ->create();

    
    $paymentIntentId = $order->orderPackages[0]->getLatestOrderPackagePayment->transaction_reference;

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

    $this->postJson(route('stripe.webhook'), $payload, [
        'Stripe-Signature' => 'mocked_signature_header'
    ])->assertOk();

    $orderPackagePayment = $order->fresh()->orderPackages[0]->getLatestOrderPackagePayment;

    expect($orderPackagePayment)
        ->status->toBe(OrderPackagePaymentStatus::Completed)
        ->gateway_reference->toBe('ch_mock_charge_999');

    expect($order->orderPackages[0]->orderPackageStatuses)->toHaveCount(2);
    expect($order->orderPackages[0]->orderPackageStatuses[0]->status)->toBe(OrderPackageStatus::ToPay);
    expect($order->orderPackages[0]->getLatestOrderPackageStatus->status)->toBe(OrderPackageStatus::ToShip);
});