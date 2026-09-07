<?php

use App\Enums\OrderPackagePaymentStatus;
use App\Enums\OrderPackageStatus as OrderPackageStatusEnum;
use App\Models\CartItem;
use App\Models\Customer;
use App\Models\CustomerAddress;
use App\Models\Product;
use App\Models\Variant;
use App\Models\Vendor;
use App\Services\Payments\StripeService;
use Database\Factories\Address\AddressFactory;
use Database\Factories\CustomerAddressFactory;
use Illuminate\Support\Facades\Http;

test('a customer can place its orders with xendit available payment methods', function ($dataset) {
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
            "channel_code" => $dataset['channel_code'],
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
    $address = AddressFactory::luzon();
    $customerAddress = CustomerAddress::factory()->for($customer)->create();
    $customerAddress->address()->create($address);

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
            'vendor_id' => $item->variant->product->vendor_id,
            'variant_id' => $item->variant()->first()->id,
            'quantity_ordered' => $item->quantity,
            'price_at_purchased' => bcdiv($item->variant()->first()->price->getAmount(), 10000, 4),
        ];
    }, $selectedCartItems);

    $payload = [
        'customer_address_id' => $customer->customerAddresses[0]->id,
        'order_details' => [
            'total_amount' => "100.00",
            'shipping_address' => '123 Main St',
        ],
        'order_items' => $orderedCartItems,
        'payment_method' => $dataset['value'],
    ];

    $this->actingAs($customer->user, 'sanctum')
        ->postJson(route('orders.place'), $payload)
        ->assertCreated()
        ->assertJsonStructure([
            'data' => ['payment_request_id', 'reference_id', 'redirect_url']
        ]);

    expect($customer->orders)->toHaveCount(1);

    $order = $customer->orders->first();

    expect($order->orderPackages)->toHaveCount(2);
    expect($order->orderPackages[0]->orderPackageItems)->toHaveCount(2);
    expect($order->orderPackages[1]->orderPackageItems)->toHaveCount(1);

    $order->orderPackages->each(function ($package) use ($dataset) {
        expect($package->orderPackagePayments)->toHaveCount(1);

        $package->orderPackagePayments->each(function ($payment) use ($dataset) {
            expect($payment)
                ->status->toBe(OrderPackagePaymentStatus::Pending)
                ->transaction_reference->toBe('pr-test-mock-12345')
                ->payment_method->toBe($dataset['channel_code']);
        });
    });

    $order->orderPackages->each(function ($package) {
        $package->orderPackageStatuses->each(function ($status) {
            expect($status->status)->toBe(OrderPackageStatusEnum::ToPay);
        });
    });
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
])->skip();

test('a customer can place its orders with stripe payment', function () {
    $this->mock(StripeService::class, function ($mock) {
        $mock->shouldReceive('gatewayResponseVerification')
            ->once()
            ->andReturn(true);

        $mock->shouldReceive('getPaymentMethod')
            ->andReturn('stripe');

        $mock->shouldReceive('getTransactionReference')
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
    $address = AddressFactory::luzon();
    $customerAddress = CustomerAddress::factory()->for($customer)->create();
    $customerAddress->address()->create($address);
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
            'vendor_id' => $item->variant->product->vendor_id,
            'variant_id' => $item->variant()->first()->id,
            'quantity_ordered' => $item->quantity,
            'price_at_purchased' => bcdiv($item->variant()->first()->price->getAmount(), 10000, 4),
        ];
    }, $selectedCartItems);

    $payload = [
        'customer_address_id' => $customer->customerAddresses[0]->id,
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

    expect($order->orderPackages)->toHaveCount(2);
    expect($order->orderPackages[0]->orderPackageItems)->toHaveCount(2);
    expect($order->orderPackages[1]->orderPackageItems)->toHaveCount(1);

    $order->orderPackages->each(function ($package) {
        expect($package->orderPackagePayments)->toHaveCount(1);

        $package->orderPackagePayments->each(function ($payment) {
            expect($payment)
                ->status->toBe(OrderPackagePaymentStatus::Pending)
                ->transaction_reference->toBe('pi_test_mock_12345')
                ->payment_method->toBe('stripe');
        });
    });

    $order->orderPackages->each(function ($package) {
        $package->orderPackageStatuses->each(function ($status) {
            expect($status->status)->toBe(OrderPackageStatusEnum::ToPay);
        });
    });
})->skip();

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


    // $addressA = AddressFactory::luzon('region_1');
    // $addressB = AddressFactory::luzon('region_2');
    // $addressC = AddressFactory::luzon('region_3');
    // dd($addressA, $addressB, $addressC);

    // $address = AddressFactory::visayas('region_6');
    // $address = AddressFactory::visayas('region_7');
    // $address = AddressFactory::visayas('region_8');

    // $address = AddressFactory::mindanao('region_9');
    // $address = AddressFactory::mindanao('region_10');
    // $address = AddressFactory::mindanao('region_11');

    // $address = AddressFactory::region()->province()->city()->barangay()->create();
    // $address = AddressFactory::all();

    $vendors = Vendor::factory(3)->hasWarehouses()->create();
    $vendorA = $vendors[0];
    $vendorB = $vendors[1];

    $customer = Customer::factory()->create();
    // $address = AddressFactory::luzon()->create();
    $addressA = AddressFactory::mindanao('region_9');
    $payload = [
        'recipient_name' => 'John Doe',
        'phone_number'   => '09171234567',
        'is_default'     => true,
        'label'          => 'Home',
    ];
    $customerAddress = $customer->customerAddresses()->create($payload);
    $customerAddress->address()->create($addressA);

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
            'vendor_id' => $item->variant->product->vendor_id,
            'variant_id' => $item->variant()->first()->id,
            'quantity_ordered' => $item->quantity,
            'price_at_purchased' => bcdiv($item->variant()->first()->price->getAmount(), 10000, 4),
        ];
    }, $selectedCartItems);

    $payload = [
        'customer_address_id' => $customer->customerAddresses[0]->id,
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

    expect($order->orderPackages)->toHaveCount(2);
    expect($order->orderPackages[0]->orderPackageItems)->toHaveCount(2);
    expect($order->orderPackages[1]->orderPackageItems)->toHaveCount(1);

    $order->orderPackages->each(function ($package) {
        expect($package->orderPackagePayments)->toHaveCount(1);

        $package->orderPackagePayments->each(function ($payment) {
            expect($payment)
                ->status->toBe(OrderPackagePaymentStatus::Pending)
                ->transaction_reference->toBe('PAYPAL-ORDER-12345')
                ->payment_method->toBe('paypal');
        });
    });

    $order->orderPackages->each(function ($package) {
        $package->orderPackageStatuses->each(function ($status) {
            expect($status->status)->toBe(OrderPackageStatusEnum::ToPay);
        });
    });
})->skip();
