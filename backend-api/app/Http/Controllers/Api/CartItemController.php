<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCartItemRequest;
use App\Traits\HttpResponses;
use Illuminate\Http\JsonResponse;

class CartItemController extends Controller
{
    use HttpResponses;

    public function store(StoreCartItemRequest $request): JsonResponse
    {
        $customer = $request->user()->customer;

        $item = $customer->cart->cartItems()->create($request->validated());

        return $this->success(
            $item,
            'Item added',
            201
        );
    }
}
