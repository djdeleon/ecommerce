<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CreateInventoryStockRequest;
use App\Models\Variant;
use App\Services\InventoryStockService;
use App\Traits\HttpResponses;
use Illuminate\Http\JsonResponse;

class InventoryStockController extends Controller
{
    use HttpResponses;

    public function store(CreateInventoryStockRequest $request, Variant $variant, InventoryStockService $service): JsonResponse
    {
        $stock = $service->adjust($request->validated(), $request->user()->id, $variant);

        return $this->success(
            $stock,
            'Stock created',
            201
        );
    }
}
