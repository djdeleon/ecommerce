<?php

namespace App\Services\Payments;

use App\Models\Order;
use Exception;
use Illuminate\Support\Facades\Http;

class PaypalService
{
    protected string $clientId;
    protected string $secret;
    protected string $baseUrl;

    public function __construct(string $clientId, string $secret)
    {
        $this->clientId = $clientId;
        $this->secret = $secret;
        $this->baseUrl = config('services.paypal.sandbox.api_url');
    }

    public function createToken(): string
    {
        $response = Http::asForm()
            ->withBasicAuth($this->clientId, $this->secret)
            ->post("{$this->baseUrl}/v1/oauth2/token", [
                'grant_type' => 'client_credentials',
            ]);

        if ($response->failed()) {
            throw new Exception('PayPal token creation failed: ' . $response->body());
        }

        return $response->json('access_token');
    }

    public function createOrder(Order $order): array
    {
        $token = $this->createToken();

        $response = Http::withToken($token)
            ->post("{$this->baseUrl}/v2/checkout/orders", [
                'intent' => 'CAPTURE',
                'purchase_units' => [
                    [
                        'reference_id' => (string) $order->id,
                        'amount' => [
                            'currency_code' => 'USD',
                            'value' => $order->total_amount
                        ],
                    ],
                ],
                'application_context' => [
                    'return_url' => url('/checkout/success'),
                    'cancel_url' => url('/checkout/cancel'),
                ]
            ]);

        if ($response->failed()) {
            throw new Exception('Failed to create PayPal Order: ' . $response->body());
        }
        
        return $response->json();
    }

    public function captureOrder(string $paypalOrderId): array
    {
        $token = $this->createToken();

        $response = Http::withToken($token)
            ->withBody('{}', 'application/json')
            ->post("{$this->baseUrl}/v2/checkout/orders/{$paypalOrderId}/capture");

        if ($response->failed()) {
            throw new Exception('Failed to capture PayPal Order: ' . $response->body());
        }

        return $response->json();
    }
}
