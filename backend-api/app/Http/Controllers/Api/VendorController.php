<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\RegisterVendorRequest;
use App\Models\OrderPackage;
use App\Services\LogisiticService;
use App\Services\VendorService;
use App\Traits\HttpResponses;
use Illuminate\Http\Request;

class VendorController extends Controller
{
    use HttpResponses;

    public function arrangeShipment(Request $request, OrderPackage $orderPackage)
    {
        $vendor = $request->user()->vendor;
        $customer = $orderPackage->order->customer;

        $logisticService = new LogisiticService();
        $logisticService->ship($orderPackage, $vendor, $customer);

        return $this->success(
            null,
            'Shipment arranged.'
        );

        

        



























        // $logisticService = new LogisiticService();

        // $orderPackage->orderPackageItems->each(function ($item) use ($logisticService) {
        //     $shippingAddress = $item->orderPackage->shipping_address;
        //     $weight = 9;

        //     $item->orderPackageItemFacilities->each(function ($facility) use ($logisticService, $shippingAddress, $weight) {
        //         $response = $logisticService->book($shippingAddress, $facility->fullAddress(), $weight);


        //         dd($response);
        //     });
        // });
    }

    public function readyForPickup(Request $request, OrderPackage $orderPackage)
    {
        $logisticService = new LogisiticService();
        $logisticService->toPickup($orderPackage);

        return $this->success(
            null,
            'Order Package is now ready to pick up.'
        );
    }

    public function dashboard(Request $request)
    {
        return response()->json([
            'data' => [
                'id' => $request->user()->id,
                'name' => $request->user()->name,
                'email' => $request->user()->email,
            ]
        ]);
    }

    public function register(RegisterVendorRequest $request, VendorService $vendorService)
    {
        $data = $vendorService->registerNewVendor($request->validated());

        return $this->success(
            $data,
            'Vendor registered',
            201,
        );
    }
}
