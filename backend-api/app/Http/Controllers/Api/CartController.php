<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Traits\HttpResponses;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CartController extends Controller
{
    use HttpResponses;

    public function index(Request $request): JsonResponse
    {
        $customer = $request->user()->customer;
        $cart = $customer->cart()->with(['customer', 'cartItems'])->first();

        return $this->success(
            $cart,
            'Carts retrieved',
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
