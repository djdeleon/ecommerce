<?php

namespace App\Http\Controllers\Api;

use App\Enums\OrderItemStatus as OrderItemStatusEnum;
use App\Enums\OrderPaymentStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\CreateOrderRequest;
use App\Models\Order;
use App\Models\OrderPayment;
use App\Services\Payments\PaypalService;
use App\Traits\HttpResponses;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    use HttpResponses;

    public function place(CreateOrderRequest $request): JsonResponse
    {
        $customer = $request->user()->customer;
        $data = $request->validated();

        $paypalOrder = DB::transaction(function () use ($customer, $data) {
            $order = $customer->orders()->create($data['order_details']);
            $orderItems = $order->orderItems()->createMany($data['order_items']);

            $orderItemStatusesPayload = $orderItems->map(function ($orderItem) use ($customer) {
                return [
                    'id' => $orderItem->id,
                    'status' => OrderItemStatusEnum::TO_PAY,
                    'changed_by_id' => $customer->user_id, // for now, I am thinking who would be the actor for the first order status
                    'notes' => 'Waiting for payment.',
                ];
            });

            $paypalService = new PaypalService(
                config('services.paypal.sandbox.client_id'), 
                config('services.paypal.sandbox.secret')
            );
            $paypalOrder = $paypalService->createOrder($order);

            $orderPayment = $order->orderPayments()->create([
                'payment_method' => $data['payment_method'],
                'transaction_reference' => $paypalOrder['id'],
                'amount_paid' => $data['order_details']['total_amount'],
                'gateway_reference' => fake()->bothify('GY-#####-??'),
                'status' => OrderPaymentStatus::PENDING, // or $paypalOrder['status'] returns "CREATED"
            ]);

            $orderItems->zip($orderItemStatusesPayload)->each(function ($data) {
                [$orderItem, $payload] = $data;

                $platformCommssionFee = 10.000;
                $grossAmount = $orderItem->quantity_ordered * $orderItem->price_at_purchased;
                $netPayoutAmount = $grossAmount - $platformCommssionFee;

                $orderItem->sellerPayoutLedger()->create([
                    'gross_amount'            => $grossAmount,
                    'platform_commission_fee' => $platformCommssionFee,
                    'net_payout_amount'       => $netPayoutAmount,
                    'status'                  => 'pending',
                ]);

                $orderItem->orderItemStatuses()->create($payload);
            });

            // $paymentGatewayResponse = 'completed';

            // if ($paymentGatewayResponse === 'completed') {
            //     $orderPayment->update([
            //         'status' => OrderPaymentStatus::COMPLETED,
            //     ]);
            // }

            // if ($order->latestOrderPayment->status === OrderPaymentStatus::COMPLETED) {
            //     $order->orderItems->each(function ($orderItem) use ($customer) {
            //         $orderItem->orderItemStatuses()->create([
            //             'status' => OrderItemStatusEnum::TO_SHIP,
            //             'changed_by_id' => $customer->user_id, // for now, I am thinking who would be the actor for the first order status
            //             'notes' => 'Your order is currently being processed.',
            //         ]);
            //     });
            // } else if ($order->latestOrderPayment->status === OrderPaymentStatus::COMPLETED) {}

            return $paypalOrder;
        });

        $approvalUrl = collect($paypalOrder['links'])->firstWhere('rel', 'approve')['href'];

        return $this->success(
            [
                'paypal_order_id' => $paypalOrder['id'],
                'redirect_url' => $approvalUrl,
            ],
            'Order placed. Please redirect user to approve payment.',
            201
        );
    }

    public function capture(Request $request)
    {
        $request->validate([
            'paypal_order_id' => ['required', 'string']
        ]);

        $paypalOrderId = $request->input('paypal_order_id');

        $paypalService = new PaypalService(
            config('services.paypal.sandbox.client_id'),
            config('services.paypal.sandbox.secret'),
        );
        
        $orderPayment = OrderPayment::where('transaction_reference', $paypalOrderId)->firstOrFail();
        
        $captureData = $paypalService->captureOrder($paypalOrderId);
        $captureDetails = $captureData['purchase_units'][0]['payments']['captures'][0];
        $fee = $captureDetails['seller_receivable_breakdown']['paypal_fee']['value'];
        $net = $captureDetails['seller_receivable_breakdown']['net_amount']['value'];

        $orderPayment->gateway_reference = $captureDetails['id'];
        $orderPayment->status = OrderPaymentStatus::COMPLETED;
        $orderPayment->transaction_fee = $fee;
        $orderPayment->net_amount = $net;
        $orderPayment->gateway_response = $captureData;
        $orderPayment->save();

        $order = $orderPayment->order;
        $order->orderItems->each(function ($orderItem) {
            $orderItem->orderItemStatuses()->create([
                'status' => OrderItemStatusEnum::TO_SHIP,
                'changed_by_id' => $orderItem->order->customer->user_id ?? 1,
                'notes' => 'Order has been paid.',
            ]);
        });

        return $this->success(
            null,
            'Payment captured successfully.'
        );
    }

    public function cancel(Order $order): JsonResponse
    {
        $actor = 'customer';
        $target = OrderItemStatusEnum::CANCELLED;
        $orderPayment = $order->latestOrderPayment;

        $order->orderItems->each(function ($orderItem) use ($target, $actor, $orderPayment) {
            $current = $orderItem->latestOrderItemStatus->status;
            $orderPaymentStatus = $orderPayment->status;

            if (! $current->canTransitionWithPayment($target, $orderPaymentStatus, $actor)) {
                return response()->json([
                    'error' => 'Illegal State Transition',
                    'message' => "Item ID {$orderItem->id} cannot be cancelled because it is in [{$current->value}] status with payment [{$orderPaymentStatus->value}]."
                ]);
            }
        });

        DB::transaction(function () use ($order, $orderPayment, $target) {
            $order->orderItems->each(function ($orderItem) use ($target) {
                $orderItem->orderItemStatuses()->create([
                    'status' => $target,
                    'changed_by_id' => $orderItem->order->customer->user_id,
                    'notes' => 'Customer cancelled the order.',
                ]);
            });
                    
            $order->orderPayments()->create([
                'payment_method' => $orderPayment->payment_method,
                'transaction_reference' => fake()->numerify('TN-##########'),
                'amount_paid' => $order->total_amount,
                'gateway_reference' => 'GY-' . fake()->uuid(),
                'status' => OrderPaymentStatus::REFUNDED,
            ]);
        });

        return $this->success(
            null,
            'Order cancelled.'
        );
    }
}
