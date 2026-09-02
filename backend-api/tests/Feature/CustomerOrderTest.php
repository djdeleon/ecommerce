<?php

use App\Enums\OrderItemStatus as OrderItemStatusEnum;
use App\Enums\OrderPaymentStatus;
use App\Models\CartItem;
use App\Models\Customer;
use App\Models\Order;
use App\Models\Product;
use App\Models\Variant;
use App\Models\Vendor;
use App\Services\Payments\StripeService;
use Illuminate\Support\Facades\Http;

test('a customer can cancel its to_ship paid orders', function () {
    $order = Order::factory()
            ->toShip(2)
            ->create();

    $this->actingAs($order->customer->user, 'sanctum')
        ->postJson(route('orders.cancel', $order))
        ->assertOk();

    $order->refresh();

    expect($order->orderPayments)->toHaveCount(2);
    expect($order->orderPayments[0]->status)->toBe(OrderPaymentStatus::COMPLETED);
    expect($order->latestOrderPayment->status)->toBe(OrderPaymentStatus::FAILED);

    expect($order->orderItems)->toHaveCount(2);
    
    $order->orderItems->each(function ($orderItem) {
        expect($orderItem->orderItemStatuses)->toHaveCount(3);
        expect($orderItem->orderItemStatuses[0]->status)->toBe(OrderItemStatusEnum::TO_PAY);
        expect($orderItem->orderItemStatuses[1]->status)->toBe(OrderItemStatusEnum::TO_SHIP);
        expect($orderItem->latestOrderItemStatus->status)->toBe(OrderItemStatusEnum::CANCELLED);
    });
})->only();

test('a customer can cancel its to_pay unpaid orders', function () {
    $order = Order::factory()
        ->toPay(2)
        ->create();
    
    $this->actingAs($order->customer->user, 'sanctum')
        ->postJson(route('orders.cancel', $order))
        ->assertOk();

    $order->refresh();

    expect($order->orderPayments)->toHaveCount(1);
    expect($order->latestOrderPayment->status)->toBe(OrderPaymentStatus::FAILED);

    expect($order->orderItems)->toHaveCount(2);

    $order->orderItems->each(function ($orderItem) {
        expect($orderItem->orderItemStatuses)->toHaveCount(2);
        expect($orderItem->orderItemStatuses[0]->status)->toBe(OrderItemStatusEnum::TO_PAY);
        expect($orderItem->latestOrderItemStatus->status)->toBe(OrderItemStatusEnum::CANCELLED);
    });
})->only();

test('a customer can place its orders with xendit available payment methods', function ($payment) {
    Http::fake([
        '*/v3/payment_requests' => Http::response([
            "payment_request_id" => "pr-test-mock-12345",
            "country" => "PH",
            "currency" => "PHP",
            "business_id" => "6a96a6c9b6944cd91cb75290",
            "reference_id" => "ORD-1-1788308622",
            "description" => "Description examples",
            "metadata" => [
                "metametadata" => "metametametadata"
            ],
            "created" => "2026-09-02T00:23:41.406Z",
            "updated" => "2026-09-02T00:23:41.406Z",
            "status" => "REQUIRES_ACTION",
            "capture_method" => "AUTOMATIC",
            "channel_code" => $payment['channel_code'],
            "request_amount" => 100,
            "channel_properties" => [
                "success_return_url" => "https://xendit.co/success",
                "failure_return_url" => "https://xendit.co/failure"
            ],
            "type" => "PAY",
            "actions" => [
                [
                    "type" => "REDIRECT_CUSTOMER",
                    "descriptor" => "WEB_URL",
                    "value" => "https://ewallet-mock-connector.xendit.co/v1/ewallet_connector/checkouts?token=dabmp3dh527c73ck662g"
                ]
            ]
        ], 201)
    ]);

    $vendors = Vendor::factory(3)->create();
    $vendorA = $vendors[0];
    $vendorB = $vendors[1];

    $customer = Customer::factory()->create();
    $cart = $customer->cart;

    $product = Product::factory()->for($vendorA)->create();
    $variants = Variant::factory(3)->for($product)->create();
    $vendorAVariantA = $variants[0];
    $vendorAVariantB = $variants[1];

    $product = Product::factory()->for($vendorB)->create();
    $variants = Variant::factory(3)->for($product)->create();
    $vendorBVariantA = $variants[0];

    CartItem::factory()->for($cart)->create(['variant_id' => $vendorAVariantA->id]);
    CartItem::factory()->for($cart)->create(['variant_id' => $vendorAVariantB->id]);
    CartItem::factory()->for($cart)->create(['variant_id' => $vendorBVariantA->id]);

    $selectedCartItems = [
        $cart->cartItems[0],
        $cart->cartItems[1],
        $cart->cartItems[2],
    ];

    $orderedCartItems = array_map(function ($item) {
        return [
            'variant_id' => $item->variant()->first()->id,
            'quantity_ordered' => $item->quantity,
            'price_at_purchased' => bcdiv($item->variant()->first()->price->getAmount(), 10000, 4),
        ];
    }, $selectedCartItems);

    $payload = [
        'order_details' => [
            'total_amount' => "100.00",
            'shipping_address' => '123 Main St',
        ],
        'order_items' => $orderedCartItems,
        'payment_method' => $payment['value'],
    ];

    $this->actingAs($customer->user, 'sanctum')
        ->postJson(route('orders.place'), $payload)
        ->assertCreated()
        ->assertJsonStructure([
            'data' => ['payment_request_id', 'reference_id', 'redirect_url']
        ]);
    
    expect($customer->orders)->toHaveCount(1);

    $order = $customer->orders->first();

    expect($order->orderItems)->toHaveCount(3);
    $order->orderItems->each(function ($orderItem) {
        expect($orderItem->orderItemStatuses)->toHaveCount(1);
        expect($orderItem->orderItemStatuses[0]->status)->toBe(OrderItemStatusEnum::TO_PAY);
        expect($orderItem->latestOrderItemStatus->status)->toBe(OrderItemStatusEnum::TO_PAY);
    });

    expect($order->orderPayments)->toHaveCount(1);
    expect($order->orderPayments->first())
        ->status->toBe(OrderPaymentStatus::PENDING)
        ->transaction_reference->toBe('pr-test-mock-12345')
        ->payment_method->toBe($payment['channel_code']);
})->with([
    'xendit gcash payment' => [
        ['channel_code' => "GCASH", 'value' => 'gcash'],
    ],
    'xendit paymaya payment' => [
        ['channel_code' => "PAYMAYA", 'value' => 'paymaya'],
    ],
    'xendit grabpay payment' => [
        ['channel_code' => "GRABPAY", 'value' => 'grabpay'],
    ],
    'xendit shopeepay payment' => [
        ['channel_code' => "SHOPEEPAY", 'value' => 'shopeepay'],
    ],
    'xendit qrph payment' => [
        ['channel_code' => "QRPH", 'value' => 'qrph'],
    ],
]);

test('a customer can place its orders with stripe payment', function () {
    $this->mock(StripeService::class, function ($mock) {
        $mock->shouldReceive('gatewayResponseVerification')
            ->once()
            ->andReturn(true);

        $mock->shouldReceive('getPaymentMethod')
            ->once()
            ->andReturn('stripe');

        $mock->shouldReceive('getTransactionReference')
            ->once()
            ->andReturn('pi_test_mock_12345');

        $mock->shouldReceive('orderCreationResponse')
            ->once()
            ->andReturn([
                "id" => "pi_3UB7Cb0bzHVebQGT1uzpi00w",
                "client_secret" => "pi_3UB7Cb0bzHVebQGT1uzpi00w_secret_lqsFNwvziN2SZdvNA5jhjzSj3"
            ]);
            
        $mock->shouldReceive('pay')
            ->once()
            ->andReturn([
                'id' => 'pi_test_mock_12345',
                'client_secret' => 'pi_test_mock_12345_secret_abcde',
            ]);
    });
    
    $vendors = Vendor::factory(3)->create();
        $vendorA = $vendors[0];
        $vendorB = $vendors[1];

        $customer = Customer::factory()->create();
        $cart = $customer->cart;

        $product = Product::factory()->for($vendorA)->create();
        $variants = Variant::factory(3)->for($product)->create();
        $vendorAVariantA = $variants[0];
        $vendorAVariantB = $variants[1];

        $product = Product::factory()->for($vendorB)->create();
        $variants = Variant::factory(3)->for($product)->create();
        $vendorBVariantA = $variants[0];

        CartItem::factory()->for($cart)->create(['variant_id' => $vendorAVariantA->id]);
        CartItem::factory()->for($cart)->create(['variant_id' => $vendorAVariantB->id]);
        CartItem::factory()->for($cart)->create(['variant_id' => $vendorBVariantA->id]);

        $selectedCartItems = [
            $cart->cartItems[0],
            $cart->cartItems[1],
            $cart->cartItems[2],
        ];

        $orderedCartItems = array_map(function ($item) {
            return [
                'variant_id' => $item->variant()->first()->id,
                'quantity_ordered' => $item->quantity,
                'price_at_purchased' => bcdiv($item->variant()->first()->price->getAmount(), 10000, 4),
            ];
        }, $selectedCartItems);

    $payload = [
        'order_details' => [
            'total_amount' => "100.00",
            'shipping_address' => '123 Main St',
        ],
        'order_items' => $orderedCartItems,
        'payment_method' => 'stripe',
    ];

    $this->actingAs($customer->user, 'sanctum')
        ->postJson(route('orders.place'), $payload)
        ->assertCreated()
        ->assertJsonStructure(['data' => ['id', 'client_secret']]);
    
    expect($customer->orders)->toHaveCount(1);

    $order = $customer->orders->first();

    expect($order->orderItems)->toHaveCount(3);
    $order->orderItems->each(function ($orderItem) {
        expect($orderItem->orderItemStatuses)->toHaveCount(1);
        expect($orderItem->orderItemStatuses[0]->status)->toBe(OrderItemStatusEnum::TO_PAY);
        expect($orderItem->latestOrderItemStatus->status)->toBe(OrderItemStatusEnum::TO_PAY);
    });

    expect($order->orderPayments)->toHaveCount(1);
    expect($order->orderPayments->first())
        ->status->toBe(OrderPaymentStatus::PENDING)
        ->transaction_reference->toBe('pi_test_mock_12345')
        ->payment_method->toBe('stripe');
});

test('a customer can place its orders with paypal payment', function () {
        Http::fake([
            '*/v1/oauth2/token' => Http::response([
                'access_token' => 'mocked-paypal-token',
            ], 200),

            '*/v2/checkout/orders' => Http::response([
                'id' => 'PAYPAL-ORDER-12345',
                'status' => 'CREATED',
                'links' => [
                    ['rel' => 'approve', 'href' => 'https://www.sandbox.paypal.com/checkoutnow?token=PAYPAL-ORDER-12345']
                ]
            ], 201)
        ]);

        $vendors = Vendor::factory(3)->create();
        $vendorA = $vendors[0];
        $vendorB = $vendors[1];

        $customer = Customer::factory()->create();
        $cart = $customer->cart;

        $product = Product::factory()->for($vendorA)->create();
        $variants = Variant::factory(3)->for($product)->create();
        $vendorAVariantA = $variants[0];
        $vendorAVariantB = $variants[1];

        $product = Product::factory()->for($vendorB)->create();
        $variants = Variant::factory(3)->for($product)->create();
        $vendorBVariantA = $variants[0];

        CartItem::factory()->for($cart)->create(['variant_id' => $vendorAVariantA->id]);
        CartItem::factory()->for($cart)->create(['variant_id' => $vendorAVariantB->id]);
        CartItem::factory()->for($cart)->create(['variant_id' => $vendorBVariantA->id]);

        $selectedCartItems = [
            $cart->cartItems[0],
            $cart->cartItems[1],
            $cart->cartItems[2],
        ];

        $orderedCartItems = array_map(function ($item) {
            return [
                'variant_id' => $item->variant()->first()->id,
                'quantity_ordered' => $item->quantity,
                'price_at_purchased' => bcdiv($item->variant()->first()->price->getAmount(), 10000, 4),
            ];
        }, $selectedCartItems);

        $payload = [
            'order_details' => [
                'total_amount' => "100.00",
                'shipping_address' => '123 Main St',
            ],
            'order_items' => $orderedCartItems,
            'payment_method' => 'paypal',
        ];

    $this->actingAs($customer->user)
        ->postJson(route('orders.place'), $payload)
        ->assertCreated()
        ->assertJsonStructure(['data' => ['id', 'redirect_url']]);

    expect($customer->orders)->toHaveCount(1);

    $order = $customer->orders->first();

    expect($order->orderItems)->toHaveCount(3);
    $order->orderItems->each(function ($orderItem) {
        expect($orderItem->orderItemStatuses)->toHaveCount(1);
        expect($orderItem->orderItemStatuses[0]->status)->toBe(OrderItemStatusEnum::TO_PAY);
        expect($orderItem->latestOrderItemStatus->status)->toBe(OrderItemStatusEnum::TO_PAY);
    });

    expect($order->orderPayments)->toHaveCount(1);
    expect($order->orderPayments->first())
        ->status->toBe(OrderPaymentStatus::PENDING)
        ->transaction_reference->toBe('PAYPAL-ORDER-12345')
        ->payment_method->toBe('paypal');
});
