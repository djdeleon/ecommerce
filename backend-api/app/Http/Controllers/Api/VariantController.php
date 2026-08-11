<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CreateVariantRequest;
use App\Http\Requests\UpdateVariantRequest;
use App\Models\Product;
use App\Models\Variant;
use App\Traits\HttpResponses;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;

class VariantController extends Controller
{
    use HttpResponses;

    public function store(CreateVariantRequest $request, Product $product): JsonResponse
    {
        $variant = $product->variants()->create($request->validated());

        return $this->success(
            $variant,
            'Product Variant created',
            Response::HTTP_CREATED
        );
    }

    public function update(UpdateVariantRequest $request, Product $product, Variant $variant)
    {
        $variant->update($request->validated());

        return $this->success(
            $variant,
            'Variant updated',
            200
        );
    }
}
