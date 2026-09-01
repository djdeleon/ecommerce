<?php

namespace App\Http\Controllers\Api;

use App\Enums\OrderItemStatus as OrderItemStatusEnums;
use App\Enums\OrderPaymentStatus;
use App\Http\Controllers\Controller;
use App\Models\OrderPayment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class XenditWebhookController extends Controller
{
    public function handle(Request $request)
    {
        $event = $request->input('event');
        $data = $request->input('data');

        logger()->info('Xendit Webhook Received:', [
            'event' => $event,
            'data' => $data,
        ]);

        // Locate our local pending payment ledger row using Xendit's reference_id
        $referenceId = $data['reference_id'] ?? null;
        $orderPayment = OrderPayment::where('transaction_reference', $referenceId)->first();

        logger()->info('Order Payment Found:', [
            'order_payment' => $orderPayment?->toArray(),
            'order_items' => $orderPayment?->order->orderItems->toArray(),
        ]);

        if (! $orderPayment) {
            return response()->json(['status' => 'ignored', 'message' => 'No matching payment record found.'], 200);
        }

        if ($event === 'payment.capture' && $data['status'] === "SUCCEEDED" && $orderPayment->status === OrderPaymentStatus::PENDING) {
            $order = $orderPayment->order;
            $capture = $data['captures'][0];

            DB::transaction(function () use ($order, $orderPayment, $capture) {
                $orderPayment->update([
                    'payment_method' => 'xendit',
                    'status' => OrderPaymentStatus::COMPLETED,
                    'net_amount' => $capture['capture_amount'],
                    'gateway_reference' => $capture['capture_id'],
                ]);

                $order->orderItems->each(function ($orderItem) {
                    $updatedOrderItemStatuses = $orderItem->orderItemStatuses()->create([
                        'status' => OrderItemStatusEnums::TO_SHIP,
                        'changed_by_id' => $orderItem->order->customer->user_id,
                        'notes' => 'Payment successfully captured via GCash.',
                    ]);
    
                    logger()->info('Order Statuses:', [
                        'order_statuses' => $updatedOrderItemStatuses?->toArray(),
                    ]);
                });

                logger()->info('Order Updated Payment Found:', [
                    'updated_order_payment' => $order->orderPayments?->toArray(),
                ]);
            });
        }

        // --- BRANCH 2: Payment Failed or Expired! (Shopee Retry Style) ---
        // if (in_array($event, ['payment_request.failed', 'payment_request.expiry']) && $orderPayment->status === OrderPaymentStatus::PENDING) {
        //     // Update the single ledger attempt to FAILED.
        //     // Items remain in TO_PAY so the customer can click "Pay Now" again!
        //     $orderPayment->update([
        //         'status' => OrderPaymentStatus::FAILED,
        //     ]);
        // }

        return response()->json(['status' => 'success'], 200);
    }
}
