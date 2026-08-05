<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\RegisterVendorRequest;
use App\Http\Requests\UpgradeVendorRequest;
use App\Services\VendorService;
use App\Traits\HttpResponses;
use Illuminate\Http\Request;

class VendorController extends Controller
{
    use HttpResponses;

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
