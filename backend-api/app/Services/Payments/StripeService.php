<?php

namespace App\Services\Payments;

use App\Models\Order;
use Exception;
use Stripe\Event;
use Stripe\Exception\SignatureVerificationException;
use Stripe\StripeClient;
use Stripe\Webhook;
use UnexpectedValueException;

class StripeService
{
    public StripeClient $client;

    public function __construct()
    {
        $this->client = new StripeClient(config('services.stripe.sandbox.secret'));
    }

    public function createPaymentIntent(Order $order)
    {
        $amountInCents = (int) bcmul($order->total_amount, '100', 0);

        $paymentIntent = $this->client->paymentIntents->create([
            'amount' => $amountInCents,
            'currency' => 'usd',
            'metadata' => [
                'order_id' => (string) $order->id,
                'customer_id' => (string) $order->customer_id,
            ],
            'automatic_payment_methods' => [
                'enabled' => true,
            ],
        ]);

        return [
            'id' => $paymentIntent->id,
            'client_secret' => $paymentIntent->client_secret,
        ];
    }

    public function verifyWebhook(string $payload, string $signatureHeader): Event
    {
        try {
            return Webhook::constructEvent(
                $payload,
                $signatureHeader,
                config('services.stripe.sandbox.webhook_secret')
            );
        } catch (UnexpectedValueException $e) {
            throw new Exception('Invalid payload: ' . $e->getMessage());
        } catch (SignatureVerificationException $e) {
            throw new Exception('Invalid signature: ' . $e->getMessage());
        }
    }
}