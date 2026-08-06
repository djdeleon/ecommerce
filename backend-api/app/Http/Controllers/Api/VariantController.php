<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CreateVariantRequest;
use App\Models\Product;
use App\Traits\HttpResponses;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;

class VariantController extends Controller
{
    use HttpResponses;

    public function store(CreateVariantRequest $request, Product $product): JsonResponse
    {
        $variant = $product->variants()->create([
            'sku' => $request['sku'],
            'price' => $request['price'],
        ]);

        return $this->success(
            $variant,
            'Product Variant created',
            Response::HTTP_CREATED
        );
    }
}
