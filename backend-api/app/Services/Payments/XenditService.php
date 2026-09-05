<?php

namespace App\Services\Payments;

use App\Models\Order;
use App\Services\Contracts\PaymentServiceInterface;
use Illuminate\Support\Facades\Http;

class XenditService implements PaymentServiceInterface
{
    protected string $secretKey;
    protected string $baseUrl;
    protected string $channelCode;

    public function __construct()
    {
        $this->secretKey = config('services.xendit.secret');
        $this->baseUrl = config('services.xendit.api_url');
    }

    public function setChannelCode(string $channelCode): self
    {
        $this->channelCode = strtoupper($channelCode);
        
        return $this;
    }

    public function pay(Order $order): array
    {
        return $this->createPaymentRequest($order, $this->channelCode);
    }

    public function gatewayResponseVerification(array $response): bool
    {
        if (isset($response['status']) && $response['status'] === 'REQUIRES_ACTION') {
            foreach ($response['actions'] as $action) {
                if ($action['type'] === 'REDIRECT_CUSTOMER') {
                    return true;
                }
            }
        }

        return false;
    }

    public function getPaymentMethod(array $response): string
    {
        return $this->channelCode;
    }

    public function getTransactionReference(array $response): string
    {
        return $response['payment_request_id'];
    }

    public function orderCreationResponse(array $response): array
    {
        $redirectUrl = '';

        foreach ($response['actions'] as $action) {
            if ($action['type'] === "REDIRECT_CUSTOMER") {
                $redirectUrl = $action['value'];
            }
        }

        return [
            'payment_request_id' => $response['payment_request_id'],
            'reference_id' => $response['reference_id'],
            'redirect_url' => $redirectUrl,
        ];
    }

    public function createPaymentRequest(Order $order, string $paymentMethod)
    {
        $refId = 'ORD-' . $order->id . '-' . time();

        $response = Http::withBasicAuth($this->secretKey, '')
            ->withHeader('api-version', '2024-11-11')
            ->post('https://api.xendit.co/v3/payment_requests', [
                "reference_id" => $refId,
                "type" => "PAY",
                "country" => "PH",
                "currency" => "PHP",
                "request_amount" => (float) $order->total_amount,
                "capture_method" => "AUTOMATIC",
                "channel_code" => strtoupper($paymentMethod),
                "channel_properties" => [
                    "failure_return_url" => "https://xendit.co/failure",
                    "success_return_url" => "https://xendit.co/success"
                ],
                "description" => "Description examples",
                "metadata" => [
                    "metametadata" => "metametametadata"
                ]
            ]);

        return $response->json();
    }
}