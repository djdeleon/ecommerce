<?php

namespace App\Http\Controllers\Api;

use App\Actions\CancelOrderAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\CreateOrderRequest;
use App\Models\Order;
use App\Actions\PlaceOrderAction;
use App\Models\OrderPackage;
use App\Traits\HttpResponses;
use Illuminate\Http\JsonResponse;

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
