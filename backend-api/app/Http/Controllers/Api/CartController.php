<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCartRequest;
use App\Models\Cart;
use App\Traits\HttpResponses;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CartController extends Controller
{
    use HttpResponses;

    /**
     * GET
     * List of all customer's cart items
     */
    public function index()
    {
        // 
    }

    /**
     * This is the "add to cart" button
     */
    public function store(StoreCartRequest $request): JsonResponse
    {
        $customer = $request->user()->customer;

        $item = $customer->carts()->create($request->validated());

        return $this->success(
            $item,
            'Item added',
            201
        );
    }

    /**
     * This is the check/uncheck option radio button
     */
    public function update()
    {
        // 
    }

    /**
     * POST
     * Every time the customer selects an item in the cart, the total amount gets calculated.
     */
    public function calculate()
    {
        // 
    }
}
