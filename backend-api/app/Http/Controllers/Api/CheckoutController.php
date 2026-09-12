<?php

namespace App\Http\Controllers\Api;

use App\Actions\ProcessCheckoutAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\CreateCheckoutRequest;
use App\Traits\HttpResponses;
use Illuminate\Http\JsonResponse;

class CheckoutController extends Controller
{
    use HttpResponses;

    public function process(CreateCheckoutRequest $request, ProcessCheckoutAction $processCheckoutAction): JsonResponse
    {
        $items = $processCheckoutAction->execute($request);

        dd($items);

        return $this->success(
            $items,
            'Cart calculated',
        );
    }
}
