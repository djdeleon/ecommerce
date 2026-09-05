<?php

namespace App\Http\Controllers\Api;

use App\Enums\OrderPackagePaymentStatus;
use App\Enums\OrderPackageStatus;
use App\Http\Controllers\Controller;
use App\Models\OrderPackagePayment;
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

            $orderPayment = OrderPackagePayment::where('transaction_reference', $paymentIntentId)->first();

            
            if ($orderPayment && $orderPayment->status === OrderPackagePaymentStatus::Pending) {
                $order = $orderPayment->orderPackage->order;

                DB::transaction(function () use ($order, $orderPayment, $chargeId) {
                    $orderPayment->update([
                        'payment_method' => 'stripe',
                        'status' => OrderPackagePaymentStatus::Completed,
                        'gateway_reference' => $chargeId,
                    ]);

                    $order->orderPackages->each(function ($package) {
                            $package->orderPackageStatuses()->create([
                                'status' => OrderPackageStatus::ToShip,
                                'changed_by_id' => $package->order->customer->user_id,
                                'notes' => 'Payment succesfully captured via card.',
                            ]);
                    });
                });

            }
        }

        return response()->json(['status' => 'success'], 200);
    }
}
