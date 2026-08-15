<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CreateWarehouseRequest;
use App\Models\Vendor;
use App\Models\Warehouse;
use App\Traits\HttpResponses;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WarehouseController extends Controller
{
    use HttpResponses;

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $warehouses = $user->hasRole('admin')
            ? Warehouse::paginate(15)
            : $user->vendor->warehouses()->paginate(15);

        return $this->success(
            $warehouses,
            'Warehouses retrieved'
        );
    }

    public function store(CreateWarehouseRequest $request): JsonResponse
    {
        $user = $request->user();

        $warehouse = $user->hasRole('admin')
            ? Vendor::find($request['vendor_id'])->warehouses()->create($request->validated())
            : $user->vendor->warehouses()->create($request->validated());

        return $this->success(
            $warehouse,
            'Warehouse created',
            201
        );
    }
}
