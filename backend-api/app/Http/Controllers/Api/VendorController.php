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
        $logisticService = new LogisiticService();

        $orderPackage->orderPackageItems->each(function ($item) use ($logisticService) {
            $shippingAddress = $item->orderPackage->shipping_address;
            $weight = 9;

            $item->orderPackageItemFacilities->each(function ($facility) use ($logisticService, $shippingAddress, $weight) {
                $response = $logisticService->book($shippingAddress, $facility->fullAddress(), $weight);


                dd($response);
            });
        });
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
