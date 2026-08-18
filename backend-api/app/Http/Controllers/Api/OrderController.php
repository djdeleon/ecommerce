<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    public function place()
    {
        $payload = [
            // orders table
            'customer_id',
            'total_amount', // from the variants/cart items // I think we need Service calculate()
            'status', // pending, paid
            'shipping_address', // from the customer's profile

            // order_items table
            'order_id',
            'variant_id', // from the variants/cart items
            'vendor_id', // variant->product->vendor_id
            'quantity_ordered', // from frontend
            'price_at_purchased', // from variant->price

            // order_item_statuses table
            'item_id',
            'status', // to_pay, to_ship...
            'changed_by_id', // actor
            'notes', // from frontned
            
            // seller_payout_ledgers table (ONLY IF the item gets paid)
            'item_id',
            'vendor_id',
            'gross_amount',
            'platform_commission_fee', // from platform
            'net_payout_amount', // business logic
            'status', // held_in_scrow

            // payments table (ONLY IF the customer pays)
            'order_id',
            'payment_method', // Paypal, STripe
            'transaction_reference', // 'TN-###-###'
            'amount_paid', // from payload
            'gateway_reference', // from third party
            'status', // settled
        ];
    }
}
