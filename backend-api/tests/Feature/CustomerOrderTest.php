<?php

use App\Actions\ProcessCheckoutAction;
use App\Enums\OrderPackagePaymentStatus;
use App\Enums\OrderPackageStatus as OrderPackageStatusEnum;
use App\Models\CartItem;
use App\Models\Customer;
use App\Models\CustomerAddress;
use App\Models\FulfillmentHub;
use App\Models\Product;
use App\Models\Variant;
use App\Models\Vendor;
use App\Models\Warehouse;
use App\Services\CartService;
use App\Services\CheckoutService;
use App\Services\GeolocationService;
use App\Services\LogisiticService;
use App\Services\Logistic\Drivers\JntExpressDriver;
use App\Services\Payments\StripeService;
use Database\Factories\Address\AddressFactory;
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
});

test('a customer can place its orders with checkout process', function () {
    // -------------------------------------------------------------
    // Platform Fulfillment Hub (A, B, C)
    // -------------------------------------------------------------
    $hubA = FulfillmentHub::factory()->create();
    $address = AddressFactory::luzon('region_1', 1);
    $hubA->address()->create($address);

    $address = AddressFactory::visayas('region_6', 1);
    $hubB = FulfillmentHub::factory()->create();
    $hubB->address()->create($address);

    $address = AddressFactory::mindanao('region_9', 1);
    $hubC = FulfillmentHub::factory()->create();
    $hubC->address()->create($address);

    // -------------------------------------------------------------
    // Vendor A
    // -------------------------------------------------------------
    $vendorA = Vendor::factory()->create();

    // -------------------------------------------------------------
    // Vendor A Warehouses (A, B, C)
    // -------------------------------------------------------------
    $warehouseA = $vendorA->warehouses()->create([
        'name' => 'Warehouse A',
        'contact_number' => '09171234567',
    ]);
    $address = AddressFactory::luzon('region_1', 2);
    $warehouseA->address()->create($address);

    $warehouseB = $vendorA->warehouses()->create([
        'name' => 'Warehouse B',
        'contact_number' => '09171232227',
    ]);
    $address = AddressFactory::visayas('region_6', 2);
    $warehouseB->address()->create($address);

    $warehouseC = $vendorA->warehouses()->create([
        'name' => 'Warehouse C',
        'contact_number' => '09171231239',
    ]);
    $address = AddressFactory::mindanao('region_9', 2);
    $warehouseC->address()->create($address);

    // -------------------------------------------------------------
    // Vendor A Product
    // -------------------------------------------------------------
    Product::factory()->hasVariants(2)->for($vendorA)->create();

    // -------------------------------------------------------------
    // Vendor A Product Variant Stock
    // -------------------------------------------------------------
    $variantA = $vendorA->products[0]->variants[0];

    $variantA->inventoryStocks()->create([
        'inventorable_type' => Warehouse::class,
        'inventorable_id' => $warehouseA->id,
        'quantity_available' => 5,
        'quantity_reserved' => 0,
    ]);
    $variantA->inventoryStocks()->create([
        'inventorable_type' => Warehouse::class,
        'inventorable_id' => $warehouseB->id,
        'quantity_available' => 10,
        'quantity_reserved' => 0,
    ]);
    $variantA->inventoryStocks()->create([
        'inventorable_type' => Warehouse::class,
        'inventorable_id' => $warehouseC->id,
        'quantity_available' => 15,
        'quantity_reserved' => 0,
    ]);
    $variantA->inventoryStocks()->create([
        'inventorable_type' => FulfillmentHub::class,
        'inventorable_id' => $hubA->id,
        'quantity_available' => 5,
        'quantity_reserved' => 0,
    ]);
    $variantA->inventoryStocks()->create([
        'inventorable_type' => FulfillmentHub::class,
        'inventorable_id' => $hubB->id,
        'quantity_available' => 10,
        'quantity_reserved' => 0,
    ]);
    $variantA->inventoryStocks()->create([
        'inventorable_type' => FulfillmentHub::class,
        'inventorable_id' => $hubC->id,
        'quantity_available' => 15,
        'quantity_reserved' => 0,
    ]);

    $variantAA = $vendorA->products[0]->variants[1];

    $variantAA->inventoryStocks()->create([
        'inventorable_type' => Warehouse::class,
        'inventorable_id' => $warehouseA->id,
        'quantity_available' => 5,
        'quantity_reserved' => 0,
    ]);
    $variantAA->inventoryStocks()->create([
        'inventorable_type' => FulfillmentHub::class,
        'inventorable_id' => $hubC->id,
        'quantity_available' => 15,
        'quantity_reserved' => 0,
    ]);

    // -------------------------------------------------------------
    // Vendor B
    // -------------------------------------------------------------
    $vendorB = Vendor::factory()->create();

    // -------------------------------------------------------------
    // Vendor B Warehouses (A, B, C)
    // -------------------------------------------------------------
    $warehouseA = $vendorB->warehouses()->create([
        'name' => 'Warehouse D',
        'contact_number' => '09171222567',
    ]);
    $address = AddressFactory::luzon('region_1', 3);
    $warehouseA->address()->create($address);

    $warehouseB = $vendorB->warehouses()->create([
        'name' => 'Warehouse E',
        'contact_number' => '09172232227',
    ]);
    $address = AddressFactory::visayas('region_6', 3);
    $warehouseB->address()->create($address);

    $warehouseC = $vendorB->warehouses()->create([
        'name' => 'Warehouse F',
        'contact_number' => '09172231239',
    ]);
    $address = AddressFactory::mindanao('region_9', 3);
    $warehouseC->address()->create($address);

    // -------------------------------------------------------------
    // Vendor B Product
    // -------------------------------------------------------------
    Product::factory()->hasVariants()->for($vendorB)->create();

    // -------------------------------------------------------------
    // Vendor B Product Variant Stock
    // -------------------------------------------------------------
    $variantB = $vendorB->products[0]->variants[0];

    $variantB->inventoryStocks()->create([
        'inventorable_type' => Warehouse::class,
        'inventorable_id' => $warehouseA->id,
        'quantity_available' => 5,
        'quantity_reserved' => 0,
    ]);
    $variantB->inventoryStocks()->create([
        'inventorable_type' => Warehouse::class,
        'inventorable_id' => $warehouseB->id,
        'quantity_available' => 10,
        'quantity_reserved' => 0,
    ]);
    $variantB->inventoryStocks()->create([
        'inventorable_type' => Warehouse::class,
        'inventorable_id' => $warehouseC->id,
        'quantity_available' => 15,
        'quantity_reserved' => 0,
    ]);
    $variantB->inventoryStocks()->create([
        'inventorable_type' => FulfillmentHub::class,
        'inventorable_id' => $hubA->id,
        'quantity_available' => 5,
        'quantity_reserved' => 0,
    ]);
    $variantB->inventoryStocks()->create([
        'inventorable_type' => FulfillmentHub::class,
        'inventorable_id' => $hubB->id,
        'quantity_available' => 10,
        'quantity_reserved' => 0,
    ]);
    $variantB->inventoryStocks()->create([
        'inventorable_type' => FulfillmentHub::class,
        'inventorable_id' => $hubC->id,
        'quantity_available' => 15,
        'quantity_reserved' => 0,
    ]);

    // -------------------------------------------------------------
    // Vendor C
    // -------------------------------------------------------------
    $vendorC = Vendor::factory()->create();

    // -------------------------------------------------------------
    // Vendor C Warehouses (A, B, C)
    // -------------------------------------------------------------
    $warehouseA = $vendorC->warehouses()->create([
        'name' => 'Warehouse G',
        'contact_number' => '09171634567',
    ]);
    $address = AddressFactory::luzon('region_2', 1);
    $warehouseA->address()->create($address);

    $warehouseB = $vendorC->warehouses()->create([
        'name' => 'Warehouse H',
        'contact_number' => '09171232327',
    ]);
    $address = AddressFactory::visayas('region_7', 1);
    $warehouseB->address()->create($address);

    $warehouseC = $vendorC->warehouses()->create([
        'name' => 'Warehouse I',
        'contact_number' => '09121231239',
    ]);
    $address = AddressFactory::mindanao('region_10', 1);
    $warehouseC->address()->create($address);

    // -------------------------------------------------------------
    // Vendor C Product
    // -------------------------------------------------------------
    Product::factory()->hasVariants()->for($vendorC)->create();

    // -------------------------------------------------------------
    // Vendor C Product Variant Stock
    // -------------------------------------------------------------
    $variantC = $vendorC->products[0]->variants[0];
    $variantC->actual_weight_kg = 2;
    $variantC->package_height_cm = 20;
    $variantC->package_length_cm = 20;
    $variantC->package_width_cm = 30;
    $variantC->save();

    $variantC->inventoryStocks()->create([
        'inventorable_type' => Warehouse::class,
        'inventorable_id' => $warehouseA->id,
        'quantity_available' => 5,
        'quantity_reserved' => 0,
    ]);
    $variantC->inventoryStocks()->create([
        'inventorable_type' => Warehouse::class,
        'inventorable_id' => $warehouseB->id,
        'quantity_available' => 10,
        'quantity_reserved' => 0,
    ]);
    $variantC->inventoryStocks()->create([
        'inventorable_type' => Warehouse::class,
        'inventorable_id' => $warehouseC->id,
        'quantity_available' => 15,
        'quantity_reserved' => 0,
    ]);
    $variantC->inventoryStocks()->create([
        'inventorable_type' => FulfillmentHub::class,
        'inventorable_id' => $hubA->id,
        'quantity_available' => 5,
        'quantity_reserved' => 0,
    ]);
    $variantC->inventoryStocks()->create([
        'inventorable_type' => FulfillmentHub::class,
        'inventorable_id' => $hubB->id,
        'quantity_available' => 10,
        'quantity_reserved' => 0,
    ]);
    $variantC->inventoryStocks()->create([
        'inventorable_type' => FulfillmentHub::class,
        'inventorable_id' => $hubC->id,
        'quantity_available' => 15,
        'quantity_reserved' => 0,
    ]);

    // -------------------------------------------------------------
    // Customer
    // -------------------------------------------------------------
    $customer = Customer::factory()->create();
    $customerAddress = CustomerAddress::factory()->for($customer)->create();
    $address = AddressFactory::luzon('region_3', 3);
    $customerAddress->address()->create($address);
    $customerZone = $customerAddress->address->region->zone;
    // dd($customerAddress->fullAddress());

    // -------------------------------------------------------------
    // Customer Cart Items
    // -------------------------------------------------------------
    $cart = $customer->cart;
    CartItem::factory()->for($cart)->for($variantA)->create(['quantity' => 8]);
    CartItem::factory()->for($cart)->for($variantAA)->create(['quantity' => 15]);
    CartItem::factory()->for($cart)->for($variantB)->create(['quantity' => 10]);
    CartItem::factory()->for($cart)->for($variantC)->create(['quantity' => 5]);

    $payload = [
        'selected_items_id' => $cart->cartItems->pluck('id')->all()
    ];

    $processCheckoutAction = new ProcessCheckoutAction(
        new CartService(new GeolocationService, new JntExpressDriver, new LogisiticService), 
        new CheckoutService
    );
    $items = $processCheckoutAction->execute($customer, $payload);

    // dd($items['checkout_items']);

    /**
     * Simulating Orders Payload when the customer clicks 'place order'
     */
    $ordersPayload = $items['checkout_items']->map(function ($vendorItems) {
        return [
            'vendor_id' => $vendorItems['vendor_id'],
            'items' => $vendorItems['items']->map(function ($item) {
                return [
                    'variant_id' => $item['variant']['id'],
                    'ordered_quantity' => $item['quantity'],
                    'price_at_purchased' => $item['variant']['price']
                ];

            })->all()
        ];
    })->all();

    $payload = [
        'order_items' => $ordersPayload,
        'order_details' => [
            'customer_address_id' => $customerAddress->id,
            'total_amount' => $items['grand_total'],
            'shipping_address' => $customerAddress->fullAddress(),
            'payment_method' => 'paypal',
        ],
    ];

    // dd($payload);
    // dd($ordersPayload);

    $this->actingAs($customer->user, 'sanctum')
        ->postJson(route('orders.place'), $payload)
        ->assertCreated()
        ->assertJsonStructure(['data' => ['id', 'redirect_url']]);
})->skip();
