<?php

namespace App\Http\Controllers\Api;

use App\Enums\OrderItemStatus as OrderItemStatusEnum;
use App\Enums\OrderPaymentStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\CreateOrderRequest;
use App\Models\Order;
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

        DB::transaction(function () use ($customer, $data) {
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

            $orderPayment = $order->orderPayments()->create([
                'payment_method' => $data['payment_method'],
                'transaction_reference' => fake()->bothify('TN-#####-??'),
                'amount_paid' => $data['order_details']['total_amount'],
                'gateway_reference' => fake()->bothify('GY-#####-??'),
                'status' => OrderPaymentStatus::PENDING,
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

            $paymentGatewayResponse = 'completed';

            if ($paymentGatewayResponse === 'completed') {
                $orderPayment->update([
                    'status' => OrderPaymentStatus::COMPLETED,
                ]);
            }

            if ($order->latestOrderPayment->status === OrderPaymentStatus::COMPLETED) {
                $order->orderItems->each(function ($orderItem) use ($customer) {
                    $orderItem->orderItemStatuses()->create([
                        'status' => OrderItemStatusEnum::TO_SHIP,
                        'changed_by_id' => $customer->user_id, // for now, I am thinking who would be the actor for the first order status
                        'notes' => 'Your order is currently being processed.',
                    ]);
                });
            } else if ($order->latestOrderPayment->status === OrderPaymentStatus::COMPLETED) {}
        });

        return $this->success(
            null,
            'Order placed',
            201
        );

        // $payload = [
        //     // orders table
        //     'customer_id',
        //     'total_amount', // from the variants/cart items // I think we need Service calculate()
        //     'status', // pending, paid
        //     'shipping_address', // from the customer's profile

        //     // order_items table
        //     'order_id',
        //     'variant_id', // from the variants/cart items
        //     'vendor_id', // variant->product->vendor_id
        //     'quantity_ordered', // from frontend
        //     'price_at_purchased', // from variant->price

        //     // order_item_statuses table
        //     'item_id',
        //     'status', // to_pay, to_ship...
        //     'changed_by_id', // actor
        //     'notes', // from frontned
            
        //     // seller_payout_ledgers table (ONLY IF the item gets paid)
        //     'item_id',
        //     'vendor_id',
        //     'gross_amount',
        //     'platform_commission_fee', // from platform
        //     'net_payout_amount', // business logic
        //     'status', // held_in_scrow

        //     // payments table (ONLY IF the customer pays)
        //     'order_id',
        //     'payment_method', // Paypal, STripe
        //     'transaction_reference', // 'TN-###-###'
        //     'amount_paid', // from payload
        //     'gateway_reference', // from third party
        //     'status', // settled
        // ];
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
