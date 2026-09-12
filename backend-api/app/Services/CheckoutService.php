<?php

namespace App\Services;

use Illuminate\Support\Collection;

class CheckoutService
{
    public function summationForCheckout(Collection $calculatedItems): array
    {
        return [
            'payment_methods' => [
                'paypal',
                'stripe',
                'gcash',
                'paymaya',
                'grabpay',
                'shopeepay',
                'qrph',
            ],
            'checkout_items' => $calculatedItems,
            'grand_total' => $calculatedItems->sum('merchant_total'),
        ];
    }

}