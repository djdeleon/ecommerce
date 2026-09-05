<?php

namespace App\Http\Controllers\Api;

use App\Enums\OrderItemStatus as OrderItemStatusEnum;
use App\Enums\OrderPaymentStatus as OrderPaymentStatusEnum;
use App\Http\Controllers\Controller;
use App\Models\OrderPayment;
use App\Services\Payments\PaypalService;
use Exception;
use Illuminate\Http\Request;

class PayPalWebhookController extends Controller
{
    public function handle(Request $request)
    {
        $event = $request->input('event_type');
        $resource = $request->input('resource');

        if ($event === 'CHECKOUT.ORDER.APPROVED') {
            $paypalOrderId = $resource['id'];

            $orderPayment = OrderPayment::where('transaction_reference', $paypalOrderId)->first();

            if (! $orderPayment) {
                return response()->json(['status' => 'ignored', 'message' => 'No matching payment record found.'], 200);
            }

            logger()->info('Order Payment INFO: ', [
                'order_payment' => $orderPayment?->toArray(),
            ]);

            // Idempotency Check: Only capture if DB still says Pending
            if ($orderPayment && $orderPayment->status === OrderPaymentStatusEnum::Pending) {
                $paypalService = new PaypalService(
                    config('services.paypal.sandbox.client_id'),
                    config('services.paypal.sandbox.secret'),
                );
                $capture = $paypalService->captureOrder($paypalOrderId);
                $captureDetails = $capture['purchase_units'][0]['payments']['captures'][0];
                $fee = $captureDetails['seller_receivable_breakdown']['paypal_fee']['value'];
                $net = $captureDetails['seller_receivable_breakdown']['net_amount']['value'];

                if (! $captureDetails['id']) {
                    throw new Exception('PayPal Capture ID could not be found in the gateway response.');
                }

                $orderPayment->gateway_reference = $captureDetails['id'];
                $orderPayment->status = OrderPaymentStatusEnum::Completed;
                $orderPayment->transaction_fee = $fee;
                $orderPayment->net_amount = $net;
                $orderPayment->gateway_response = $capture;
                $orderPayment->save();

                $order = $orderPayment->order;
                $order->orderItems->each(function ($orderItem) {
                    $updatedOrderItemStatuses = $orderItem->orderItemStatuses()->create([
                        'status' => OrderItemStatusEnum::ToShip,
                        'changed_by_id' => $orderItem->order->customer->user_id ?? 1,
                        'notes' => 'Order has been paid.',
                    ]);

                    logger()->info('Order Statuses:', [
                        'order_statuses' => $updatedOrderItemStatuses?->toArray(),
                    ]);
                });

                logger()->info('Order Updated Payment Found:', [
                    'updated_order_payment' => $order->orderPayments?->toArray(),
                ]);
            }
        }

        return response()->json(['status' => 'success'], 200);
    }
}
