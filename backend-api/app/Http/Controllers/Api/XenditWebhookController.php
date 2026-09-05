<?php

namespace App\Http\Controllers\Api;

use App\Enums\OrderPackagePaymentStatus;
use App\Enums\OrderPackageStatus;
use App\Http\Controllers\Controller;
use App\Models\OrderPackagePayment;
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
        $orderPayment = OrderPackagePayment::where('transaction_reference', $referenceId)->first();

        logger()->info('Order Payment Found:', [
            'order_payment' => $orderPayment?->toArray(),
            'order_items' => $orderPayment->orderPackage->orderPackageItems->toArray(),
        ]);

        if (! $orderPayment) {
            return response()->json(['status' => 'ignored', 'message' => 'No matching payment record found.'], 200);
        }

        if ($event === 'payment.capture' && $data['status'] === "SUCCEEDED" && $orderPayment->status === OrderPackagePaymentStatus::Pending) {
            $order = $orderPayment->orderPackage->order;
            $capture = $data['captures'][0];

            DB::transaction(function () use ($order, $orderPayment, $capture, $data) {
                $orderPayment->update([
                    'payment_method' => $data['channel_code'],
                    'status' => OrderPackagePaymentStatus::Completed,
                    'net_amount' => $capture['capture_amount'],
                    'gateway_reference' => $capture['capture_id'],
                ]);

                $order->orderPackages->each(function ($package) {
                    $package = $package->orderPackageStatuses()->create([
                        'status' => OrderPackageStatus::ToShip,
                        'changed_by_id' => $package->order->customer->user_id,
                        'notes' => 'Payment successfully captured via GCash.',
                    ]);
    
                    logger()->info('Order Statuses:', [
                        'order_statuses' => $package?->toArray(),
                    ]);
                });

                logger()->info('Order Updated Payment Found:', [
                    'updated_order_payment' => $order->orderPayments?->toArray(),
                ]);
            });
        }

        // --- BRANCH 2: Payment Failed or Expired! (Shopee Retry Style) ---
        // if (in_array($event, ['payment_request.failed', 'payment_request.expiry']) && $orderPayment->status === OrderPaymentStatus::Pending) {
        //     // Update the single ledger attempt to Failed.
        //     // Items remain in ToPay so the customer can click "Pay Now" again!
        //     $orderPayment->update([
        //         'status' => OrderPaymentStatus::Failed,
        //     ]);
        // }

        return response()->json(['status' => 'success'], 200);
    }
}
