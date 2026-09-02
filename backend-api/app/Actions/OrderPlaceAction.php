<?php

namespace App\Actions;

use App\Enums\OrderItemStatus;
use App\Enums\OrderPaymentStatus;
use App\Models\Customer;
use App\Models\Order;
use App\Services\Contracts\PaymentServiceInterface;
use App\Services\Payments\PaymentServiceFactory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OrderPlaceAction
{
    protected Customer $customer;
    protected Order $order;
    protected array $data;

    public function execute(Request $request): array
    {
        $this->customer = $request->user()->customer;
        $this->data = $request->validated();

        return DB::transaction(function () {
            $this->order = $this->customer->orders()->create($this->data['order_details']);

            $payment = $this->getPaymentInstance($this->data['payment_method']);

            $paymentOrder = $this->requestPaymentOrder($this->data['payment_method'], $payment);

            if (in_array($this->data['payment_method'], ['gcash', 'paymaya', 'grabpay', 'shopeepay', 'qrph'])) {
                if (isset($paymentOrder['status']) && $paymentOrder['status'] === 'REQUIRES_ACTION') {
                    foreach ($paymentOrder['actions'] as $action) {
                        if ($action['type'] === 'REDIRECT_CUSTOMER') {
                            $this->createPendingOrderPayment($paymentOrder, $this->data);
                        }
                    }
                }
            } else {
                $this->createPendingOrderPayment($paymentOrder, $this->data);
            }
            
            $this->createOrderItemsWithStatuses($this->data['order_items']);

            return $this->paymentResponse($paymentOrder);
        });
    }

    private function getPaymentInstance(string $paymentMethod): PaymentServiceInterface
    {
        return new PaymentServiceFactory()->make($paymentMethod);
    }

    private function requestPaymentOrder(string $paymentMethod, object $paymentInstance): array
    {
        return (in_array($paymentMethod, ['gcash', 'paymaya', 'grabpay', 'shopeepay', 'qrph'])) 
                ? $paymentInstance->pay($this->order, $paymentMethod)
                : $paymentInstance->pay($this->order, '');
    }

    private function createPendingOrderPayment(array $paymentOrder, array $data)
    {
        $paymentMethod = (in_array($data['payment_method'], ['stripe', 'paypal']))
                                        ? $data['payment_method']
                                        : $paymentOrder['channel_code'];

        $transactionReference = (in_array($data['payment_method'], ['stripe', 'paypal']))
                                        ? $paymentOrder['id']
                                        : $paymentOrder['payment_request_id'];

        $this->order->orderPayments()->create([
            'payment_method' => $paymentMethod,
            'transaction_reference' => $transactionReference,
            'amount_paid' => $data['order_details']['total_amount'],
            'gateway_reference' => fake()->bothify('GY-initial-#####-??'),
            'status' => OrderPaymentStatus::PENDING,
        ]);
    }

    private function createOrderItemsWithStatuses(array $items)
    {
        $orderItems = $this->order->orderItems()->createMany($items);

        $orderItems->each(function ($orderItem) {
            $orderItem->orderItemStatuses()->create([
                'status' => OrderItemStatus::TO_PAY,
                'changed_by_id' => $this->customer->user_id,
                'notes' => 'Waiting for payment.',
            ]);
        });
    }

    private function paymentResponse(array $paymentOrder): array
    {
        $response = [];

        if ($this->data['payment_method'] === 'paypal') {
            $approvalUrl = collect($paymentOrder['links'])->firstWhere('rel', 'approve')['href'];

            $response['id'] = $paymentOrder['id'];
            $response['redirect_url'] = $approvalUrl;
        } elseif ($this->data['payment_method'] === 'stripe') {
            $response['id'] = $paymentOrder['id'];
            $response['client_secret'] = $paymentOrder['client_secret'];
        } elseif (in_array($this->data['payment_method'], ['gcash', 'paymaya', 'grabpay', 'shopeepay', 'qrph'])) {
            $response = $paymentOrder;
        }

        return $response;
    }
}