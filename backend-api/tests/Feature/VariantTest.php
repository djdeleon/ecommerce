<?php

use App\Models\Address\Region;
use App\Models\CartItem;
use App\Models\Customer;
use App\Models\CustomerAddress;
use App\Models\FulfillmentHub;
use App\Models\InventoryStock;
use App\Models\Product;
use App\Models\Variant;
use App\Models\Vendor;
use App\Models\Warehouse;
use App\Services\GeolocationService;
use App\Services\LogisiticService;
use App\Services\Logistic\Drivers\JntExpressDriver;
use Database\Factories\Address\AddressFactory;

test('multiple selected item variants to multiple vendors are checked if which stock hubs is nearest to the customer\'s shipping address', function () {});

test('multiple selected item variants are checked if which stock hubs is nearest to the customer\'s shipping address', function () {
    
    // -------------------------------------------------------------
    // Available Addresses
    // -------------------------------------------------------------
    // $address = AddressFactory::luzon('region_1', 1);
    // $address = AddressFactory::luzon('region_1', 2);
    // $address = AddressFactory::luzon('region_1', 3);
    // $address = AddressFactory::luzon('region_2', 1);
    // $address = AddressFactory::luzon('region_2', 2);
    // $address = AddressFactory::luzon('region_2', 3);
    // $address = AddressFactory::luzon('region_3', 1);
    // $address = AddressFactory::luzon('region_3', 2);
    // $address = AddressFactory::luzon('region_3', 3);

    // $address = AddressFactory::visayas('region_6', 1);
    // $address = AddressFactory::visayas('region_6', 2);
    // $address = AddressFactory::visayas('region_6', 3);
    // $address = AddressFactory::visayas('region_7', 1);
    // $address = AddressFactory::visayas('region_7', 2);
    // $address = AddressFactory::visayas('region_7', 3);
    // $address = AddressFactory::visayas('region_8', 1);
    // $address = AddressFactory::visayas('region_8', 2);
    // $address = AddressFactory::visayas('region_8', 3);

    // $address = AddressFactory::mindanao('region_9', 1);
    // $address = AddressFactory::mindanao('region_9', 2);
    // $address = AddressFactory::mindanao('region_9', 3);
    // $address = AddressFactory::mindanao('region_10', 1);
    // $address = AddressFactory::mindanao('region_10', 2);
    // $address = AddressFactory::mindanao('region_10', 3);
    // $address = AddressFactory::mindanao('region_11', 1);
    // $address = AddressFactory::mindanao('region_11', 2);
    // $address = AddressFactory::mindanao('region_11', 3);

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

    // -------------------------------------------------------------
    // Customer Cart Items
    // -------------------------------------------------------------
    $cart = $customer->cart;
    CartItem::factory()->for($cart)->for($variantA)->create(['quantity' => 8]);
    CartItem::factory()->for($cart)->for($variantAA)->create(['quantity' => 15]);
    CartItem::factory()->for($cart)->for($variantB)->create(['quantity' => 10]);
    CartItem::factory()->for($cart)->for($variantC)->create(['quantity' => 5]);

    /**
     * 1. Group the Cart Items by Vendor
     */
    $eagerItems = $cart->cartItems()->with(['variant.product.vendor', 'variant.inventoryStocks.inventorable.address.region'])->get();

    $grouped = $eagerItems->groupBy(function ($item) {
        return $item->variant->product->vendor->id;
    });

    $geolocationService = new GeolocationService();
    $customerCoords = $customerAddress->coordinates();

    $vendorItems = $grouped->map(function ($groups) use ($geolocationService, $customerCoords) {
        $vendor = $groups[0]->variant->product->vendor;

        return [
            'vendor_id' => $vendor->id,
            'shop_name' => $vendor->shop_name,
            'items' => $groups->map(function ($group) use ($geolocationService, $customerCoords) {
                $price = bcdiv($group->variant->price->getAmount(), 10000, 4); 
                $quantity = $group->quantity;

                return [
                    'variant' => [
                        'id' => $group->variant_id,
                        'sku' => $group->variant->sku,
                        'price' => $price,
                        'actual_weight_kg' => $group->variant->actual_weight_kg,
                    ],
                    'product' => [
                        'id' => $group->variant->product->id,
                        'name' => $group->variant->product->name,
                        'slug' => $group->variant->product->slug,
                        'description' => $group->variant->product->description,
                    ],
                    'inventory_stocks' => $group->variant->inventoryStocks->filter(function ($stock) use ($quantity) {
                                            return $quantity <= $stock->quantity_available;
                                        })->map(function ($stock) use ($geolocationService, $customerCoords) {
                                            return [
                                                'stock_id' => $stock->id,
                                                'quantity_available' => $stock->quantity_available,
                                                'hub' => [
                                                    'name' => $stock->inventorable->name,
                                                    'coordinates' => $stock->inventorable->coordinates(),
                                                    'distance_km' => $geolocationService->calculateHaversineDistance(
                                                        $customerCoords->lat,
                                                        $customerCoords->lon,
                                                        $stock->inventorable->coordinates()->lat,
                                                        $stock->inventorable->coordinates()->lon
                                                    ),
                                                    'zone' => $stock->inventorable->address->region->zone
                                                ]
                                            ];
                                        })->values(),
                    'quantity' => $quantity,
                    'price_quantity' => bcmul($price, $quantity, 4),
                ];
            })
        ];
    });

    // dd($vendorItems);

    /**
     * 2. Get the hub closest from the customer coordinates for each item
     */
    $customerCoords = $customerAddress->coordinates();
    $jntExpressDriver = new JntExpressDriver();
    $logisticService = new LogisiticService();

    $calculatedItems = $vendorItems->map(function ($items) use ($jntExpressDriver, $logisticService, $variantC, $customerZone) {
        $items['items'] = $items['items']->map(function ($item) use ($jntExpressDriver, $logisticService, $variantC, $customerZone) {
            /**
             * Nearest Hub
             */
            $nearestHub = $item['inventory_stocks']->sortBy('hub.distance_km')->first();
            $item['nearest_hub'] = $nearestHub;

            /**
             * Unset inventory_stocks not needed anymore
             */
            $item = collect($item)->forget('inventory_stocks')->all();

            /**
             * Calculate Shipping Fee for the nearest hub with Actual and Volumetric Weight
             */
            /**
             * Getting the Weight
             * It needs to be multiplied by quantity
             */
            $weight = 0;
            $volumetricWeight = $jntExpressDriver->volumetricWeight($variantC->package_height_cm, $variantC->package_length_cm, $variantC->package_width_cm);
            $actualWeight = $variantC->actual_weight_kg;
            if ($volumetricWeight >= $actualWeight) {
                $weight = $volumetricWeight;
            }
            $weightByQuantity = $weight * $item['quantity'];

            $hubZone = $item['nearest_hub']['hub']['zone'];

            $shippingFee = $logisticService->calculateShippingFee($customerZone, $hubZone, $weightByQuantity);

            $item['shipping_fee_details'] = $shippingFee;

            $item['subtotal'] = bcadd($shippingFee['shippingFee'], $item['price_quantity'], 4);

            return $item;
        })->values();

        $items['merchant_total'] = $items['items']->sum('subtotal');

        return $items;
    })->values();

    // dd($calculatedItems);

    $summation = [
        'vendor_items' => $calculatedItems,
        'grand_total' => $calculatedItems->sum('merchant_total')
    ];

    dd($summation);


    // $customer->cart->cartItems
        // $item->variant->product->vendor
        // $item->variant->inventoryStocks
            // $stock->inventorable->address
    dd($cart->cartItems);

    $geolocationService = new GeolocationService();
    $stockHubs = $geolocationService->nearestHubWithStockCollection($cart->cartItems, $customerAddress->coordinates());

    expect($stockHub->address->region->slug)->toBe('region_10');
})->only();

test('a selected item variant is checked if which stock hubs is nearest to the customer\'s shipping address', function () {
    // -------------------------------------------------------------
    // Vendor
    // -------------------------------------------------------------
    $vendor = Vendor::factory()->create();

    // -------------------------------------------------------------
    // Vendor Warehouses (A, B, C)
    // -------------------------------------------------------------
    $warehouseA = $vendor->warehouses()->create([
        'name' => 'Warehouse A',
        'contact_number' => '09171234567',
    ]);
    $address = AddressFactory::luzon('region_1');
    $warehouseA->address()->create($address);

    $warehouseB = $vendor->warehouses()->create([
        'name' => 'Warehouse B',
        'contact_number' => '09171232227',
    ]);
    $address = AddressFactory::visayas('region_6');
    $warehouseB->address()->create($address);

    $warehouseC = $vendor->warehouses()->create([
        'name' => 'Warehouse C',
        'contact_number' => '09171231239',
    ]);
    $address = AddressFactory::mindanao('region_9');
    $warehouseC->address()->create($address);

    // -------------------------------------------------------------
    // Platform Fulfillment Hub (A, B, C)
    // -------------------------------------------------------------
    $address = AddressFactory::luzon('region_2');
    $hubA = FulfillmentHub::factory()->create();
    $hubA->address()->create($address);

    $address = AddressFactory::visayas('region_7');
    $hubB = FulfillmentHub::factory()->create();
    $hubB->address()->create($address);

    $address = AddressFactory::mindanao('region_10');
    $hubC = FulfillmentHub::factory()->create();
    $hubC->address()->create($address);

    // -------------------------------------------------------------
    // Vendor Product
    // -------------------------------------------------------------
    Product::factory()->hasVariants()->for($vendor)->create();

    // -------------------------------------------------------------
    // Vendor Product Variant Stock
    // -------------------------------------------------------------
    $variant = $vendor->products[0]->variants[0];
    $variant->inventoryStocks()->create([
        'inventorable_type' => Warehouse::class,
        'inventorable_id' => $warehouseA->id,
        'quantity_available' => 5,
        'quantity_reserved' => 0,
    ]);
    $variant->inventoryStocks()->create([
        'inventorable_type' => Warehouse::class,
        'inventorable_id' => $warehouseB->id,
        'quantity_available' => 10,
        'quantity_reserved' => 0,
    ]);
    $variant->inventoryStocks()->create([
        'inventorable_type' => Warehouse::class,
        'inventorable_id' => $warehouseC->id,
        'quantity_available' => 15,
        'quantity_reserved' => 0,
    ]);
    $variant->inventoryStocks()->create([
        'inventorable_type' => FulfillmentHub::class,
        'inventorable_id' => $hubA->id,
        'quantity_available' => 5,
        'quantity_reserved' => 0,
    ]);
    $variant->inventoryStocks()->create([
        'inventorable_type' => FulfillmentHub::class,
        'inventorable_id' => $hubB->id,
        'quantity_available' => 10,
        'quantity_reserved' => 0,
    ]);
    $variant->inventoryStocks()->create([
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
    $address = AddressFactory::luzon('region_3');
    $customerAddress->address()->create($address);

    // -------------------------------------------------------------
    // Customer Cart Item
    // -------------------------------------------------------------
    $cart = $customer->cart;
    $selectedItem = CartItem::factory()->for($cart)->for($variant)->create(['quantity' => 15]);

    $geolocationService = new GeolocationService();
    $stockHub = $geolocationService->nearestHubWithStock($selectedItem, $customerAddress->coordinates());

    expect($stockHub->address->region->slug)->toBe('region_10');
});

test('a variant can be stocked in different warehouses and fulfillment hubs', function () {
    // -------------------------------------------------------------
    // Vendor
    // -------------------------------------------------------------
    $vendor = Vendor::factory()->create();

    // -------------------------------------------------------------
    // Vendor Warehouses (A, B, C)
    // -------------------------------------------------------------
    $warehouseA = $vendor->warehouses()->create([
        'name' => 'Warehouse A',
        'contact_number' => '09171234567',
    ]);
    $address = AddressFactory::luzon('region_1');
    $warehouseA->address()->create($address);

    $warehouseB = $vendor->warehouses()->create([
        'name' => 'Warehouse B',
        'contact_number' => '09171232227',
    ]);
    $address = AddressFactory::visayas('region_6');
    $warehouseB->address()->create($address);

    $warehouseC = $vendor->warehouses()->create([
        'name' => 'Warehouse C',
        'contact_number' => '09171231239',
    ]);
    $address = AddressFactory::mindanao('region_9');
    $warehouseC->address()->create($address);

    // -------------------------------------------------------------
    // Platform Fulfillment Hub (A, B, C)
    // -------------------------------------------------------------
    $address = AddressFactory::luzon('region_2');
    $hubA = FulfillmentHub::factory()->create();
    $hubA->address()->create($address);

    $address = AddressFactory::visayas('region_7');
    $hubB = FulfillmentHub::factory()->create();
    $hubB->address()->create($address);

    $address = AddressFactory::mindanao('region_10');
    $hubC = FulfillmentHub::factory()->create();
    $hubC->address()->create($address);

    // -------------------------------------------------------------
    // Vendor Product
    // -------------------------------------------------------------
    Product::factory()->hasVariants()->for($vendor)->create();

    // -------------------------------------------------------------
    // Vendor Product Variant Stock
    // -------------------------------------------------------------
    $variant = $vendor->products[0]->variants[0];
    $variant->inventoryStocks()->create([
        'inventorable_type' => Warehouse::class,
        'inventorable_id' => $warehouseA->id,
        'quantity_available' => 5,
        'quantity_reserved' => 0,
    ]);
    $variant->inventoryStocks()->create([
        'inventorable_type' => Warehouse::class,
        'inventorable_id' => $warehouseB->id,
        'quantity_available' => 10,
        'quantity_reserved' => 0,
    ]);
    $variant->inventoryStocks()->create([
        'inventorable_type' => Warehouse::class,
        'inventorable_id' => $warehouseC->id,
        'quantity_available' => 15,
        'quantity_reserved' => 0,
    ]);
    $variant->inventoryStocks()->create([
        'inventorable_type' => FulfillmentHub::class,
        'inventorable_id' => $hubA->id,
        'quantity_available' => 5,
        'quantity_reserved' => 0,
    ]);
    $variant->inventoryStocks()->create([
        'inventorable_type' => FulfillmentHub::class,
        'inventorable_id' => $hubB->id,
        'quantity_available' => 10,
        'quantity_reserved' => 0,
    ]);
    $variant->inventoryStocks()->create([
        'inventorable_type' => FulfillmentHub::class,
        'inventorable_id' => $hubC->id,
        'quantity_available' => 15,
        'quantity_reserved' => 0,
    ]);

    expect($variant->inventoryStocks)->toHaveCount(6);
});

test('a product can have variants', function () {
    $product = Product::factory()->create();
    $payload = [
        'product_id' => $product->id,
        'sku' => $product->name . '-sku',
        'price' => 100.00
    ];

    $this->actingAs($product->vendor->user, 'sanctum')
        ->postJson(route('variants.store', $product), $payload)
        ->assertCreated();
});

test('creating a producting variant with same SKU is not allowed', function () {
    $variantA = Variant::factory()->create();
    $variantB = [
        'product_id' => $variantA->product->id,
        'sku' => $variantA->sku,
        'price' => 100.00,
    ];

    $this->actingAs($variantA->product->vendor->user, 'sanctum')
        ->postJson(route('variants.store', $variantA->product), $variantB)
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['sku']);
});

test('variant price maintains high precision price decimal 4 without rounding errors', function () {
    $product = Product::factory()->create();
    $highPrecisionPrice = 99.9876;
    
    $payload = [
        'product_id' => $product->id,
        'sku' => $product->name . '-sku',
        'price' => $highPrecisionPrice
    ];

    $this->actingAs($product->vendor->user, 'sanctum')
        ->postJson(route('variants.store', $product), $payload)
        ->assertCreated();

    $variant = $product->variants->first();

    expect((string) $variant->getRawOriginal('price'))->toBe('99.9876');

    expect($variant->price->getAmount())->toBe('999876');
});

it('it validates required fields when creating a variant', function () {
    $product = Product::factory()->create();

    $this->actingAs($product->vendor->user, 'sanctum')
        ->postJson(route('variants.store', $product), [])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['sku', 'price']);
});

it('prevents negative prices', function () {
    $product = Product::factory()->create();

    $payload = [
        'sku' => 'VAR->NEG-1',
        'price' => -10.00,
    ];

    $this->actingAs($product->vendor->user, 'sanctum')
        ->postJson(route('variants.store', $product), $payload)
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['price']);
});

it('prevents non-numeric prices', function () {
    $product = Product::factory()->create();

    $payload = [
        'sku' => 'VAR->NEG-1',
        'price' => 'invalid-price',
    ];

    $this->actingAs($product->vendor->user, 'sanctum')
        ->postJson(route('variants.store', $product), $payload)
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['price']);
});