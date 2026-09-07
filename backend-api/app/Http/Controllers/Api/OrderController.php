<?php

namespace App\Http\Controllers\Api;

use App\Actions\CancelOrderAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\CreateOrderRequest;
use App\Models\Order;
use App\Actions\PlaceOrderAction;
use App\Enums\OrderPackageStatus;
use App\Models\Address\Region;
use App\Models\OrderPackage;
use App\Models\Vendor;
use App\Traits\HttpResponses;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Http;

class OrderController extends Controller
{
    use HttpResponses;

    public function place(CreateOrderRequest $request, PlaceOrderAction $action): JsonResponse
    {
        // $baseUrl = config('services.logistic.url');
        // $key = config('services.logistic.key');

        // $customer = $request->user()->customer;
        // $originRegion = Region::findOrFail($customer->customerAddresses[0]->region_id);

        // $data = $request->validated();

        // // TODO: need destination region
        // $vendorItems = collect($data['order_items'])->groupBy('vendor_id');

        // $vendorIds = $vendorItems->keys();

        // $vendorRegions = [];

        // $vendorIds->each(function ($id) use (&$vendorRegions, $baseUrl, $key, $originRegion) {
        //     $vendor = Vendor::findOrFail($id);

        //     $vendor->warehouses->each(function ($warehouse) use ($id, &$vendorRegions, $baseUrl, $key, $originRegion) {
        //         if ($warehouse->warehouseAddress->is_default) {
        //             $vendorRegion = Region::findOrFail($warehouse->warehouseAddress->region_id);
        //             // $vendorRegions[$id] = $vendorRegion->slug;

        //             $response = Http::withToken($key)->post("{$baseUrl}/jnt/sample", [
        //                 'origin_region' => $originRegion->slug,
        //                 'destination_region' => $vendorRegion->slug,
        //                 'weight_kg' => 2.5,
        //             ]);

        //             if ($response->failed()) {
        //                 dd($response->body());
        //             }

        //             dd($response->json());


        //         }
        //     });
        // });

        // dd('here');

        // $response = Http::withToken($key)->post("{$baseUrl}/jnt/sample", [
        //     'origin_region' => $originRegion->slug,
        //     'destination_region' => 'region_13',
        //     'weight_kg' => 2.5,
        // ]);

        // if ($response->failed()) {
        //     dd($response->body());
        // }

        // dd($response->json());

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

    public function rejected(OrderPackage $orderPackage)
    {
        $orderPackage->ensureItemsCanTransition(OrderPackageStatus::Returned);

        $orderPackage->orderPackageStatuses()->create([
            'changed_by_id' => $orderPackage->order->customer->user_id,
            'status' => OrderPackageStatus::Rejected,
            'notes' => 'The requested return order is rejected.'
        ]);

        return $this->success(
            null,
            'The requested return order is rejected.'
        );
    }

    public function returned(OrderPackage $orderPackage)
    {
        $orderPackage->ensureItemsCanTransition(OrderPackageStatus::Returned);

        $orderPackage->orderPackageStatuses()->create([
            'changed_by_id' => $orderPackage->order->customer->user_id,
            'status' => OrderPackageStatus::Returned,
            'notes' => 'Order has been returned.'
        ]);

        return $this->success(
            null,
            'Order has been returned.'
        );
    }

    public function toReturn(OrderPackage $orderPackage)
    {
        $target = OrderPackageStatus::ToReturn;
        $orderPackage->ensureItemsCanTransition($target);

        $orderPackage->orderPackageStatuses()->create([
            'changed_by_id' => $orderPackage->order->customer->user_id,
            'status' => $target,
            'notes' => 'Returning of order is now being processed.'
        ]);

        return $this->success(
            null,
            'Returning of order is now being processed.'
        );
    }
    public function completed(Order $order)
    {
        $order->ensurePackagesCanTransition(OrderPackageStatus::Completed);

        $order->orderPackages->each(function ($package) use ($order) {
            $package->orderPackageStatuses()->create([
                'changed_by_id' => $order->customer->user_id,
                'status' => OrderPackageStatus::Completed,
                'notes' => 'Order is now completed.'
            ]);
        });

        return $this->success(
            null,
            'Order is now completed.'
        );
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

    public function toReceive(OrderPackage $orderPackage)
    {   
        $vendor = request()->user();
        $orderPackage->ensureItemsCanTransition(OrderPackageStatus::ToReceive);

        $orderPackage->orderPackagestatuses()->create([
            'changed_by_id' => $vendor->id,
            'status' => OrderPackageStatus::ToReceive,
            'notes' => 'Order is now being shipped.'
        ]);

        return $this->success(
            null,
            'Order is now being shipped.'
        );
    }

    public function cancelAsVendor(OrderPackage $orderPackage, CancelOrderAction $action): JsonResponse
    {
        $action->execute($orderPackage);

        return $this->success(
            null,
            'Order cancelled.'
        );
    }

    public function cancelAsCustomer(Order $order, CancelOrderAction $action): JsonResponse
    {
        $action->execute($order);

        return $this->success(
            null,
            'Order cancelled.'
        );
    }
}
