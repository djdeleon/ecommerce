<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CreateWarehouseRequest;
use App\Models\Vendor;
use App\Traits\HttpResponses;
use Illuminate\Http\JsonResponse;

class WarehouseController extends Controller
{
    use HttpResponses;

    public function store(CreateWarehouseRequest $request, Vendor $vendor): JsonResponse
    {
        $warehouse = $vendor->warehouses()->create($request->validated());

        return $this->success(
            $warehouse,
            'Warehouse created',
            201
        );
    }
}
