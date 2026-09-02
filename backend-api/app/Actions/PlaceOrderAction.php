<?php

namespace App\Actions;

use App\Enums\OrderItemStatus;
use App\Enums\OrderPaymentStatus;
use App\Models\Customer;
use App\Models\Order;
use App\Services\Contracts\PaymentServiceInterface;
use App\Services\Payments\PaymentServiceFactory;
use Exception;
use Illuminate\Support\Facades\DB;

class PlaceOrderAction
{
    public function __construct(
        protected PaymentServiceFactory $paymentFactory
    ) {}

    public function execute(Customer $customer, array $data): array
    {
        return DB::transaction(function () use ($customer, $data) {
            $order = $customer->orders()->create($data['order_details']);

            $paymentService = $this->paymentFactory->make($data['payment_method']);

            $gatewayResponse = $paymentService->pay($order);

            $isResponseVerified = $paymentService->gatewayResponseVerification($gatewayResponse);

            if (! $isResponseVerified) {
                throw new Exception("Gateway response is not valid to proceed to make a payment: " . json_encode($gatewayResponse));
            }

            $this->createPendingOrderPayment($order, $gatewayResponse, $paymentService, $data);
            
            $this->createOrderItemsWithStatuses($order, $data['order_items'], $customer);

            return $paymentService->orderCreationResponse($gatewayResponse);
        });
    }

    private function createPendingOrderPayment(Order $order, array $response, PaymentServiceInterface $paymentService, array $data)
    {
        $order->orderPayments()->create([
            'payment_method' => $paymentService->getPaymentMethod($response),
            'transaction_reference' => $paymentService->getTransactionReference($response),
            'amount_paid' => $data['order_details']['total_amount'],
            'gateway_reference' => fake()->bothify('GY-initial-#####-??'),
            'status' => OrderPaymentStatus::PENDING,
        ]);
    }

    private function createOrderItemsWithStatuses(Order $order, array $items, Customer $customer)
    {
        $orderItems = $order->orderItems()->createMany($items);

        $orderItems->each(function ($orderItem) use ($customer) {
            $orderItem->orderItemStatuses()->create([
                'status' => OrderItemStatus::TO_PAY,
                'changed_by_id' => $customer->user_id,
                'notes' => 'Waiting for payment.',
            ]);
        });
    }
}
