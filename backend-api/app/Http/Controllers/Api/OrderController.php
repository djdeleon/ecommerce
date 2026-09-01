<?php

namespace App\Http\Controllers\Api;

use App\Enums\OrderItemStatus as OrderItemStatusEnum;
use App\Enums\OrderPaymentStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\CreateOrderRequest;
use App\Models\Order;
use App\Models\OrderPayment;
use App\Services\Payments\PaypalService;
use App\Services\Payments\StripeService;
use App\Services\Payments\XenditService;
use App\Traits\HttpResponses;
use Exception;
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

        return $this->success(
            [
                'order_id' => 'payment_id_123',
                'redirect_url' => '/success',
            ],
            'Order placed. Please redirect user to approve payment.',
            201
        );
    }

    public function xenditPlace(CreateOrderRequest $request)
    {
        $customer = $request->user()->customer;
        $data = $request->validated();
        $paymentMethod = strtoupper($data['payment_method']);

        $xenditOrder = DB::transaction(function () use ($data, $customer, $paymentMethod) {
            $order = $customer->orders()->create($data['order_details']);
            
            $stripeService = new XenditService();
            $paymentRequest = $stripeService->createPaymentRequest($order, $paymentMethod);

            if (isset($paymentRequest['status']) && $paymentRequest['status'] === 'REQUIRES_ACTION') {
                foreach ($paymentRequest['actions'] as $action) {
                    if ($action['type'] === 'REDIRECT_CUSTOMER') {
                        $order->orderPayments()->create([
                            'payment_method' => $paymentRequest['channel_code'],
                            'transaction_reference' => $paymentRequest['payment_request_id'],
                            'amount_paid' => $data['order_details']['total_amount'],
                            'gateway_reference' => fake()->bothify('GY-initial-#####-??'),
                            'gateway_response' => $data,
                            'status' => OrderPaymentStatus::PENDING, // or $paypalOrder['status'] returns "CREATED"
                        ]);
                    }
                }
            }

            $orderItems = $order->orderItems()->createMany($data['order_items']);

            $orderItems->each(function ($orderItem) use ($customer) {
                $orderItem->orderItemStatuses()->create([
                    'status' => OrderItemStatusEnum::TO_PAY,
                    'changed_by_id' => $customer->user_id, // for now, I am thinking who would be the actor for the first order status
                    'notes' => 'Waiting for payment.',
                ]);
            });

            // Redirect the user to GCash validation page
            // return redirect()->away($action['value']);

            return $paymentRequest;
        });

        // return redirect()->back()->with('error', 'Payment initialization failed.');
        return $this->success(
            $xenditOrder,
            'Order placed. Please redirect user to approve payment.',
            201
        );
    }

    public function stripePlace(CreateOrderRequest $request)
    {
        $customer = $request->user()->customer;
        $data = $request->validated();
        
        $stripeOrder = DB::transaction(function () use ($data, $customer) {
            $order = $customer->orders()->create($data['order_details']);

            $stripeService = new StripeService();
            $paymentIntent = $stripeService->createPaymentIntent($order);

            $order->orderPayments()->create([
                'payment_method' => $data['payment_method'],
                'transaction_reference' => $paymentIntent['id'],
                'amount_paid' => $data['order_details']['total_amount'],
                'gateway_reference' => 'GY-null',
                'status' => OrderPaymentStatus::PENDING, // or $paypalOrder['status'] returns "CREATED"
            ]);

            $orderItems = $order->orderItems()->createMany($data['order_items']);

            $orderItems->each(function ($orderItem) use ($customer) {
                $orderItem->orderItemStatuses()->create([
                    'status' => OrderItemStatusEnum::TO_PAY,
                    'changed_by_id' => $customer->user_id, // for now, I am thinking who would be the actor for the first order status
                    'notes' => 'Waiting for payment.',
                ]);
            });

            return $paymentIntent;
        });

        return $this->success(
            $stripeOrder,
            'Order placed. Please redirect user to approve payment.',
            201
        );
    }

    public function paypalPlace(CreateOrderRequest $request): JsonResponse
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
                'gateway_reference' => fake()->bothify('GY-initial-#####-??'),
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
