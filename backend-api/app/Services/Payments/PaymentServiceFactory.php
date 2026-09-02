<?php

namespace App\Services\Payments;

use App\Services\Contracts\PaymentServiceInterface;
use InvalidArgumentException;

class PaymentServiceFactory
{
    protected array $gateways = [
        'paypal' => PaypalService::class,
        'stripe' => StripeService::class,
        'gcash' => XenditService::class,
        'paymaya' => XenditService::class,
        'grabpay' => XenditService::class,
        'shopeepay' => XenditService::class,
        'qrph' => XenditService::class,
    ];

    public function make(string $method): PaymentServiceInterface
    {
        if (! array_key_exists($method, $this->gateways)) {
            throw new InvalidArgumentException("Payment gateway [{$method}] is not supported.");
        }

        $service = app($this->gateways[$method]);

        return ($service instanceof XenditService)
            ? $service->setChannelCode($method)
            : $service;
    }
}