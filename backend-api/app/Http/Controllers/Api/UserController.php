<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpgradeUserVendorRequest;
use App\Services\UserService;
use App\Traits\HttpResponses;
use Illuminate\Http\JsonResponse;

class UserController extends Controller
{
    use HttpResponses;

    public function upgrade(UpgradeUserVendorRequest $request, UserService $service): JsonResponse
    {
        $data = $service->upgradeUserToVendor($request->user(), $request->validated());

        return $this->success(
            $data,
            'Upgraded to vendor',
            200
        );
    }
}
