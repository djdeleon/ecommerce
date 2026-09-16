<?php

use App\Enums\OrderPackagePaymentStatus;
use App\Enums\OrderPackageStatus as EnumsOrderPackageStatus;
use App\Models\CartItem;
use App\Models\Customer;
use App\Models\CustomerAddress;
use App\Models\Order;
use App\Models\OrderPackage;
use App\Models\Product;
use App\Models\Vendor;
use App\Models\Warehouse;
use Database\Factories\Address\AddressFactory;
use Illuminate\Support\Facades\DB;

test('Order Logistics', function () {
    // -------------------------------------------------------------
    // Vendor
    // -------------------------------------------------------------
    $vendor = Vendor::factory()->create();

    // -------------------------------------------------------------
    // Vendor Warehouse
    // -------------------------------------------------------------
    $warehouse = $vendor->warehouses()->create([
        'name' => 'Warehouse',
        'contact_number' => '09171234567',
    ]);
    $address = AddressFactory::luzon('region_1', 1);
    $warehouse->address()->create($address);

    // -------------------------------------------------------------
    // Vendor Product Variant
    // -------------------------------------------------------------
    Product::factory()->hasVariants()->for($vendor)->create();

    // -------------------------------------------------------------
    // Vendor Product Variant Stock
    // -------------------------------------------------------------
    $variant = $vendor->products[0]->variants[0];


    $variant->inventoryStocks()->create([
        'inventorable_type' => Warehouse::class,
        'inventorable_id' => $warehouse->id,
        'quantity_available' => 5,
        'quantity_reserved' => 0,
    ]);

    // -------------------------------------------------------------
    // Customer
    // -------------------------------------------------------------
    $customer = Customer::factory()->create();
    $customerAddress = CustomerAddress::factory()->for($customer)->create();
    $address = AddressFactory::luzon('region_3', 3);
    $customerAddress->address()->create($address);

    // -------------------------------------------------------------
    // Customer Cart Item
    // -------------------------------------------------------------
    $cart = $customer->cart;
    $cartItem = CartItem::factory()->for($cart)->for($variant)->create(['quantity' => 3]);

    // -------------------------------------------------------------
    // Customer Order
    // -------------------------------------------------------------
    $order = Order::factory()->for($customer)->create([
        'shipping_address' => $customer->customerAddresses[0]->fullAddress(),
        'total_amount' => $cartItem->quantity * bcdiv($variant->price->getAmount(), 10000, 4)
    ]);

    // -------------------------------------------------------------
    // Order Package
    // -------------------------------------------------------------
    $orderPackage = $order->orderPackages()->create([
        'shipping_address' => $customer->customerAddresses[0]->fullAddress(),
        'vendor_id' => $vendor->id
    ]);

    // -------------------------------------------------------------
    // Order Package Item
    // -------------------------------------------------------------
    $orderPackageItem = $orderPackage->orderPackageItems()->create([
        'variant_id' => $variant->id,
        'ordered_quantity' => $cartItem->quantity,
        'price_at_purchased' => bcdiv($variant->price->getAmount(), 10000, 4),
        'shipping_fee' => 125.00
    ]);

    $orderPackageItem->orderPackageItemFacilities()->create([
        'facility_id' => $variant->inventoryStocks[0]->id,
    ]);

    // -------------------------------------------------------------
    // Order Package Statuses
    // -------------------------------------------------------------
    $orderPackage->orderPackagestatuses()->create([
        'changed_by_id' => $customer->id,
        'status' => EnumsOrderPackageStatus::ToPay,
        'notes' => 'Waiting for payment...',
    ]);

    $orderPackage->orderPackagestatuses()->create([
        'changed_by_id' => $customer->id,
        'status' => EnumsOrderPackageStatus::ToShip,
        'notes' => 'Vendor is preparing your parcel...',
    ]);

    // -------------------------------------------------------------
    // Order Package Payment
    // -------------------------------------------------------------
    $orderPackage->orderPackagePayments()->create([
        'payment_method' => 'paypal',
        'transaction_reference' => 'PYPL-TN-12345',
        'amount_paid' => bcadd($orderPackageItem->shipping_fee, $order->total_amount, 2),
        'status' => OrderPackagePaymentStatus::Pending,
    ]);

    $orderPackage->orderPackagePayments()->create([
        'payment_method' => 'paypal',
        'transaction_reference' => 'PYPL-TN-12345',
        'amount_paid' => bcadd($orderPackageItem->shipping_fee, $order->total_amount, 2),
        'gateway_reference' => 'PYPL-GTWY-12345',
        'transaction_fee' => 0.10,
        'net_amount' => 0.000,
        'gateway_response' => null,
        'status' => OrderPackagePaymentStatus::Completed,
    ]);

    // we can now trigger vendor arrange-shipment on the Fastify Side
    $this->actingAs($vendor->user, 'sanctum')
        ->postJson(route('vendors.arrange-shipment', $orderPackage))
        ->assertOk();
        
    $this->actingAs($vendor->user, 'sanctum')
        ->postJson(route('vendors.ready-for-pickup', $orderPackage))
        ->assertOk();

    dump("Order Package ID: " . $orderPackage->id);
});

test('only run this test case after sucessfully running the webhookShipmentTest.test.ts to check order package status changes', function () {
    expect(OrderPackage::first()->orderPackageStatuses)->toHaveCount(4);

    $orderPackageStatuses = [
        EnumsOrderPackageStatus::ToPay,
        EnumsOrderPackageStatus::ToShip,
        EnumsOrderPackageStatus::ToReceive,
        EnumsOrderPackageStatus::Completed,
    ];

    expect(OrderPackage::first()->orderPackageStatuses->every(function ($orderPackage) use ($orderPackageStatuses) {
        return in_array($orderPackage->status, $orderPackageStatuses);
    }))->toBeTrue();
})->only();

test('manual db flush', function () {
    DB::statement('TRUNCATE TABLE 
        order_package_payments,
        order_package_statuses,
        order_package_item_facilities,
        order_package_items,
        order_packages,
        orders,
        cart_items,
        carts,
        customer_addresses,
        customers,
        inventory_stocks,
        variants,
        products,
        warehouses,
        vendors,
        entity_addresses,
        users 
        RESTART IDENTITY CASCADE;');
})->skip('to retain data');
