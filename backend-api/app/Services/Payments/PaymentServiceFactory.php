<?php

namespace App\Services\Payments;

use App\Services\Contracts\PaymentServiceInterface;

class PaymentServiceFactory
{
    public function make(string $gateway): PaymentServiceInterface
    {
        if ($gateway === 'paypal') {
            return new PaypalService(
                config('services.paypal.sandbox.client_id'), 
                config('services.paypal.sandbox.secret')
            );
        } elseif ($gateway === 'stripe') {
            return app(StripeService::class); // app() for mock testing
        } elseif (in_array($gateway, ['gcash', 'paymaya', 'grabpay', 'shopeepay', 'qrph'])) {
            return new XenditService();
        }

        return new PaypalService(
            config('services.paypal.sandbox.client_id'), 
            config('services.paypal.sandbox.secret')
        ); 
    }
}