<?php

namespace App\Http\Controllers\Api;

use App\Enums\OrderItemStatus as OrderItemStatusEnum;
use App\Enums\OrderPaymentStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\CreateOrderRequest;
use App\Models\Order;
use App\Actions\PlaceOrderAction;
use App\Traits\HttpResponses;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    use HttpResponses;

    public function place(CreateOrderRequest $request, PlaceOrderAction $action): JsonResponse
    {
        $order = $action->execute(
            $request->user()->customer,
            $request->validated()
        );

        return $this->success(
            $order,
            'Order placed. Please redirect user to approve payment.',
            201
        );
    }

    public function completed()
    {
        // Only create a sellerPayoutLedger record when the order is completed and marked by the customer
        //     $platformCommssionFee = 10.000;
        //     $grossAmount = $orderItem->quantity_ordered * $orderItem->price_at_purchased;
        //     $netPayoutAmount = $grossAmount - $platformCommssionFee;

        //     $orderItem->sellerPayoutLedger()->create([
        //         'gross_amount'            => $grossAmount,
        //         'platform_commission_fee' => $platformCommssionFee,
        //         'net_payout_amount'       => $netPayoutAmount,
        //         'status'                  => 'pending',
        //     ]);
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
