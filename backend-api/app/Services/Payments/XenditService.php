<?php

namespace App\Services\Payments;

use App\Models\Order;
use Illuminate\Support\Facades\Http;

class XenditService
{
    protected string $secretKey;
    protected string $baseUrl;

    public function __construct()
    {
        $this->secretKey = config('services.xendit.secret');
        $this->baseUrl = config('services.xendit.api_url');
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