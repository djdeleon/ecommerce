<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpgradeVendorRequest;
use App\Services\CustomerService;
use App\Traits\HttpResponses;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    use HttpResponses;

    public function dashboard(Request $request)
    {
        return response()->json(['data' => [
            'id' => $request->user()->id,
            'name' => $request->user()->name,
            'email' => $request->user()->email,
        ]]);
    }

    public function upgrade(UpgradeVendorRequest $request, CustomerService $service)
    {
        $data = $service->upgradeUserToVendor($request->user(), $request->validated());

        return $this->success(
            $data,
            'Upgraded to vendor',
            200
        );
    }
}
