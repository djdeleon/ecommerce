<?php

use App\Models\CartItem;
use App\Models\Customer;
use App\Models\Product;
use App\Models\Variant;
use App\Models\Vendor;

test('a customer can place its orders', function () {
        /**
         * Workflow
         * - Migration Files Creation
         * - Migration Tables Population
         * 
         * NOTE:
         * - Need to secure what data goes in the Controller/App
         * - Need to secure allowed/authenticated user that uses the app/sends the request
         * - Need to success/failure test for the feature
         * 
         * For recognizing the payload
         * - Identify all the fiels needed
         * - - then work on on how are you going to store this in your database design schema.
         * - - - because some of the data in the payload could be part of a table and another table.
         */

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
                'vendor_id' => $item->variant()->first()->product()->first()->vendor->id,
                'quantity_ordered' => $item->quantity,
                'price_at_purchased' => bcdiv($item->variant()->first()->price->getAmount(), 10000, 4),
            ];
        }, $selectedCartItems);

        $payload = [
            // orders table
            // 'customer_id' $customer->order()->create()
            'order_details' => [
                'total_amount' => "100.00", // source: frontend since the calculation comes from the backend
                'status' => 'pending',
                'shipping_address' => '123 Main St', // from customer's instance
            ],
            
            // order_items
            // NOTE: the array value below is for the payload but of course the insertion into the table would be one at a time or createMany()
            // 'order_id' // from $order->order_items()->create()
            // 'variant_id' => [1, 2, 3], // source: frontend
            // 'vendor_id' => [1, 2], // source: frontend ; this is already provided by the checkout controller
            // 'quantity_ordered' => 2, // source: frontend
            // 'price_at_purchased' => "50.00", // source: frontend

            'order_items' => $orderedCartItems,
            'payment_method' => 'paypal',
        ];

    $this->actingAs($customer->user)
        ->postJson(route('orders.place'), $payload)
        ->assertCreated();
})->only();