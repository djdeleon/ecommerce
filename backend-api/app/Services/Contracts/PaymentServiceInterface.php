<?php

namespace App\Services\Contracts;

use App\Models\Order;

interface PaymentServiceInterface
{
    public function pay(Order $order): array;

    public function gatewayResponseVerification(array $response): bool;

    public function getPaymentMethod(array $response): string;

    public function getTransactionReference(array $response): string;

    public function orderCreationResponse(array $response): array;
}