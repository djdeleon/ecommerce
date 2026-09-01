<?php

use App\Models\Order;
use App\Services\Payments\PaypalService;

test('paypal sandbox integration create token', function () {
    $paypalService = new PaypalService(
        config('services.paypal.sandbox.client_id'),
        config('services.paypal.sandbox.secret'),
    );

    $paypalOrder = $paypalService->createToken();

    expect($paypalOrder)->toBeString();
});

/**
 * test('paypal sandbox integration create order') AND test('paypal sandbox integration capture order') FOR ONE TIME FLOW TESTING
 * 
 * Run: docker compose exec backend-api php artisan test
 * - To approve the payment.
 * - copy the token value from PayPal Order ID terminal
 * - paste it in the test('paypal sandbox integration capture order') $paypalOrderId = '<here>';
 * - and press enter
 */
test('paypal sandbox integration create order', function () {
    $order = Order::factory()
        ->toShip()
        ->create();
    
    $paypalService = new PaypalService(
        config('services.paypal.sandbox.client_id'),
        config('services.paypal.sandbox.secret'),
    );

    $paypalOrder = $paypalService->createOrder($order);

    expect($paypalOrder)->toBeArray();
    expect($paypalOrder)->toHaveKeys(['id', 'status', 'links']);
    expect($paypalOrder['status'])->toBe('CREATED');

    $approvalUrl = collect($paypalOrder['links'])->firstWhere('rel', 'approve')['href'];
    
    expect($approvalUrl)
        ->not->toBeNull()
        ->toStartWith('https://www.sandbox.paypal.com/');

    dump("PayPal Order ID: {$paypalOrder['id']}");
    /**
     * URL: https://www.sandbox.paypal.com/signin 
     * Credentials:
     * sb-fppch52719300@personal.example.com
     * ^8JlQy3>
     */
    dump("Approval URL: {$approvalUrl}"); // login to the PayPal Developer and open this link in a new browser

    pause();
});

test('paypal sandbox integration capture order', function () {
    $paypalService = new PaypalService(
        config('services.paypal.sandbox.client_id'),
        config('services.paypal.sandbox.secret'),
    );

    $paypalOrderId = '3AX87750GR061040B';

    $captureData = $paypalService->captureOrder($paypalOrderId);

    $captureDetails = $captureData['purchase_units'][0]['payments']['captures'][0];

    expect($captureData)->toHaveKeys(['id', 'status', 'payment_source', 'purchase_units', 'payer', 'links']);
    expect($captureData['id'])->toBe($paypalOrderId);
    expect($captureDetails['id'])->toBeString();
    expect($captureDetails['status'])->toBe('COMPLETED');
    expect($captureDetails['seller_receivable_breakdown']['paypal_fee']['value'])->not->toBeNull();
    expect($captureDetails['seller_receivable_breakdown']['net_amount']['value'])->not->toBeNull();
});
