<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CreateVariantRequest;
use App\Http\Requests\UpdateVariantRequest;
use App\Models\Product;
use App\Models\Variant;
use App\Services\InventoryStockService;
use App\Traits\HttpResponses;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;

class VariantController extends Controller
{
    use HttpResponses;

    public function store(CreateVariantRequest $request, Product $product, InventoryStockService $service): JsonResponse
    {
        $variant = DB::transaction(function () use ($request, $product, $service) {
            $variant = $product->variants()->create($request->validated());

            if ($request->has('initial_stock')) {
                $service->adjust($request->input('initial_stock'), $request->user()->id, $variant);
            }

            return $variant;
        });

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
