<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CreateDriverRequest;
use App\Services\DriverService;
use App\Traits\HttpResponses;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DriverController extends Controller
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

    public function register(CreateDriverRequest $request, DriverService $service): JsonResponse
    {
        $data = $service->register($request->validated());

        return $this->success(
            $data,
            'Driver registered',
            201,
        );
    }
}
