<?php

namespace App\Http\Controllers\Api;

use App\Enums\OrderPackageStatus;
use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderPackage;
use App\Models\OrderPackageStatus as ModelsOrderPackageStatus;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class LogisticWebhookController extends Controller
{
    public function __invoke(Request $request)
    {
        $externalOrderId = $request->input('external_order_id');
        $courierId = $request->input('courier_id');
        $status = $request->input('status');

        $orderPackage = OrderPackage::findOrFail($externalOrderId);
        
        Log::info('Verify Logistics Webhook', [
            'order_package' => $orderPackage->id,
            'externalOrderId' => $externalOrderId,
            'courierId' => $courierId,
            'status' => $status,
        ]);

        DB::transaction(function () use ($orderPackage, $courierId, $status) {
            if ($status === 'PickedUp') {
                ModelsOrderPackageStatus::firstOrCreate(
                [
                    'order_package_id' => $orderPackage->id,
                    'status' => OrderPackageStatus::ToReceive,
                ],
                [
                    'changed_by_id' => $courierId,
                    'notes' => 'Order is being shipped...',
                ]);
            }

            else if ($status === 'Delivered') {
                ModelsOrderPackageStatus::firstOrCreate(
                [
                    'order_package_id' => $orderPackage->id,
                    'status' => OrderPackageStatus::Completed,
                ],
                [
                    'changed_by_id' => $courierId,
                    'notes' => 'Order is delivered',
                ]);

                // ESCROW SYSTEM INITIATION order_package_payouts
            }
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

        Log::info('Verify Logistics Webhook', [
            'order_package_status' => $orderPackage->orderPackageStatuses->toArray()
        ]);

        return response()->json([
            'success' => true,
            'message' => 'State processed smoothly.'
        ]);
    }
}
