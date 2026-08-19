<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\RegisterCustomerRequest;
use App\Services\CustomerService;
use App\Traits\HttpResponses;
use Illuminate\Http\JsonResponse;
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

    public function register(RegisterCustomerRequest $request, CustomerService $service): JsonResponse
    {
        $data = $service->register($request->validated());

        return $this->success(
            $data,
            'Customer created',
            201
        );
    }
}
