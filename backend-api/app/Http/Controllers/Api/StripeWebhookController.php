<?php

namespace App\Http\Controllers\Api;

use App\Enums\OrderItemStatus as OrderItemStatusEnums;
use App\Enums\OrderPaymentStatus;
use App\Http\Controllers\Controller;
use App\Models\OrderPayment;
use App\Services\Payments\StripeService;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StripeWebhookController extends Controller
{
    public function handle(Request $request, StripeService $stripeService)
    {
        $payload = $request->getContent();
        $sigHeader = $request->header('Stripe-Signature');

        try {
            $event = $stripeService->verifyWebhook($payload, $sigHeader);
        } catch (Exception $e) {
            return response()->json(['error' => $e->getMessage()], 401);
        }

        if ($event->type === 'payment_intent.succeeded') {
            $paymentIntent = $event->data->object;

            $paymentIntentId = $paymentIntent->id;
            $chargeId = $paymentIntent->latest_charge; // Capture ID/Receipt ID

            $orderPayment = OrderPayment::where('transaction_reference', $paymentIntentId)->first();

            if ($orderPayment && $orderPayment->status === OrderPaymentStatus::PENDING) {
                $order = $orderPayment->order;

                DB::transaction(function () use ($order, $orderPayment, $chargeId) {
                    $orderPayment->update([
                        'payment_method' => 'stripe',
                        'status' => OrderPaymentStatus::COMPLETED,
                        'gateway_reference' => $chargeId,
                    ]);

                    $order->orderItems->each(function ($orderItem) {
                            $orderItem->orderItemStatuses()->create([
                                'status' => OrderItemStatusEnums::TO_SHIP,
                                'changed_by_id' => $orderItem->order->customer->user_id,
                                'notes' => 'Payment succesfully captured via card.',
                            ]);
                    });
                });
            }
        }

        return response()->json(['status' => 'success'], 200);
    }
}
