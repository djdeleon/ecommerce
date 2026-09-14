<?php

namespace App\Services\Payments;

use App\Models\Order;
use App\Services\Contracts\PaymentServiceInterface;
use Exception;
use Illuminate\Support\Facades\Http;

class PaypalService implements PaymentServiceInterface
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

    public function pay(Order $order): array
    {
        return $this->createOrder($order);
    }

    public function gatewayResponseVerification(array $response): bool
    {
        if (
            isset($response['id']) && 
            isset($response['status']) && 
            $response['status'] === 'CREATED' &&
            is_array($response['links'])
        ) {
            foreach ($response['links'] as $link) {
                if ($link['rel'] === 'approve' && isset($link['href'])) {
                    return true;
                }
            }
        }

        return false;
    }

    public function getPaymentMethod(array $response): string
    {
        return 'paypal';
    }

    public function getTransactionReference(array $response): string
    {
        return $response['id'];
    }

    public function orderCreationResponse(array $response): array
    {
        $approvalUrl = collect($response['links'])->firstWhere('rel', 'approve')['href'];

        return [
            'id' => $response['id'],
            'redirect_url' => $approvalUrl,
        ];
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
                            'value' => bcmul($order->total_amount, '1', 2)
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
