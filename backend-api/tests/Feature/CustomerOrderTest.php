<?php

use App\Enums\OrderItemStatus as OrderItemStatusEnum;
use App\Enums\OrderPaymentStatus;
use App\Models\CartItem;
use App\Models\Customer;
use App\Models\Order;
use App\Models\Product;
use App\Models\Variant;
use App\Models\Vendor;
use Illuminate\Support\Facades\Http;

test('a customer can place its orders', function () {
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

    $response = $this->actingAs($customer->user)
        ->postJson(route('orders.place'), $payload)
        ->assertCreated();

    $response->assertJsonStructure([
        'data' => [
            'paypal_order_id',
            'redirect_url',
        ]
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
    expect($order->orderPayments->first()->status)->toBe(OrderPaymentStatus::PENDING);
});

test('a customer can approve its paypal payment order', function () {
    $order = Order::factory()
        ->toPay()
        ->create();

    $paypalOrderId = $order->orderPayments->first()->transaction_reference;

    Http::fake([
        '*/v1/oauth2/token' => Http::response([
            'access_token' => 'mocked-paypal-token',
        ], 200),

        "*/v2/checkout/orders/*/capture" => Http::response([
            'id' => 'PAYPAL-TN-12345',
            'status' => 'COMPLETED',
            "purchase_units" => [
                0 => [
                    "payments" => [
                        "captures" => [
                            0 => [
                                "id" => "PAYPAL-CAPTURE-12345",
                                "status" => "COMPLETED",
                                "amount" => [
                                "currency_code" => "USD",
                                "value" => "100.00"
                                ],
                                "seller_receivable_breakdown" => [
                                "paypal_fee" => [
                                    "currency_code" => "USD",
                                    "value" => "3.70"
                                ],
                                "net_amount" => [
                                    "currency_code" => "USD",
                                    "value" => "96.30"
                                ]
                                ]
                            ]
                        ]
                    ]
                ]
            ]
        ], 200)
    ]);

    $this->actingAs($order->customer->user, 'sanctum')
        ->postJson(route('orders.capture'), ['paypal_order_id' => $paypalOrderId])
        ->assertOk();

    expect($order->orderItems)->toHaveCount(1);
    $order->orderItems->each(function ($orderItem) {
        expect($orderItem->orderItemStatuses)->toHaveCount(2);
        expect($orderItem->orderItemStatuses[0]->status)->toBe(OrderItemStatusEnum::TO_PAY);
        expect($orderItem->latestOrderItemStatus->status)->toBe(OrderItemStatusEnum::TO_SHIP);
    });

    expect($order->latestOrderPayment)
        ->status->toBe(OrderPaymentStatus::COMPLETED)
        ->gateway_reference->toBe('PAYPAL-CAPTURE-12345');
});