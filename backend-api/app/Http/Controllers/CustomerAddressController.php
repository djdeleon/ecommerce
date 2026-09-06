<?php

namespace App\Http\Controllers;

use App\Http\Requests\CreateCustomerAddressRequest;
use App\Traits\HttpResponses;
use Illuminate\Http\JsonResponse;

class CustomerAddressController extends Controller
{
    use HttpResponses;

    public function store(CreateCustomerAddressRequest $request): JsonResponse
    {
        $customer = $request->user()->customer;

        $customerAddress = $customer->customerAddresses()->create($request->validated());

        return $this->success(
            $customerAddress,
            'Customer Address created.',
            201
        );
    }
}
