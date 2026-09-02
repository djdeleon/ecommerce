<?php

namespace App\Providers;

use App\Services\AuthService;
use App\Services\Contracts\AuthServiceInterface;
use Illuminate\Support\Facades\Request;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(AuthServiceInterface::class, AuthService::class);

        /**
         * List of Payment Methods
         * - PayPal (Link Cards)
         * - Stripe (Bank Cards)
         * - Xendit (https://docs.xendit.co/docs/available-payment-channels) 
         * - - (GCash (GCASH), PayMaya (PAYMAYA), GrabPay (GRABPAY), ShopeePay (SHOPEEPAY), QR Ph (QRPH))
         * 
         * Payment Method Types (values from the $paymentOptions in the CheckoutController, and receive it from place order $payload as $payload['payment_method'])
         * - paypal, stripe, gcash, paymaya, grabpay, shopeepay, qrph
         * 
         * Bindings ($abstract => $concrete)
         * - paypal => new PayPalService()
         * - stripe => new StripeService()
         * - [gcash, paymaya, grabpay, shopeepay, qrph] => new XenditService()
         * 
         * Interface
         * - PaymentServiceInterface
         * - -  pay(): array
         * 
         * Factory Design Pattern
         * - PaymentFactory
         * - $payment = new PaymentFactory()->make($data['payment_method']);
         * 
         */
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
