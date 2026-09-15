<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class LogisticWebhookController extends Controller
{
    public function __invoke(Request $request)
    {
        Log::info('Verify Logistics Webhook', [
            'request' => $request->all()
        ]);;

        // $externalOrderId = $request->input('external_order_id');
        // $status = $request->input('status');
        // $description = $request->input('description');

        // $order = Order::where('id', $externalOrderId)->first();

        // if (! $order) {
        //     return response()->json([
        //         'error' => 'Order not found.'
        //     ], 404);
        // }

        DB::transaction(function () {
            // if ($status === 'PickedUp') {
            //     // update here
            // } else if ($status === 'Delivered') {
            //     // ESCROW SYSTEM INITIATION
            //     // OrderPackagePayout (escrow model)
            // } else if (in_array($status, ['FailedDelivery', 'Rejected'])) {
            //     // order package item status update...
            // }

            // Append operational trace lines to Laravel's local order_histories if needed
            // $order->histories()->create([
            //     'event_type' => $status,
            //     'note' => "[Logistics Engine Log]: " . $description
            // ]);
        });

        return response()->json([
            'success' => true,
            'message' => 'State processed smoothly.'
        ]);
    }
}
