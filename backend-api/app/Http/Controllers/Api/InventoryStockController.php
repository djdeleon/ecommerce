<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CreateInventoryStockRequest;
use App\Models\FulfillmentHub;
use App\Models\Variant;
use App\Models\Warehouse;
use App\Traits\HttpResponses;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class InventoryStockController extends Controller
{
    use HttpResponses;

    public function store(CreateInventoryStockRequest $request, Variant $variant): JsonResponse
    {
        $facilityType = $request['facility_type'] === 'warehouse' ? Warehouse::class : FulfillmentHub::class;
        $delta = (int) $request['delta'];

        $stock = DB::transaction(function () use ($variant, $facilityType, $request, $delta) {
            $stock = $variant->inventoryStock()->firstOrCreate([
                'inventorable_type' => $facilityType,
                'inventorable_id' => $request['facility_id'],
            ], [
                'quantity_available' => 0,
                'quantity_reserved' => 0,
            ]);

            $stock->increment('quantity_available', $delta);

            $stock->inventoryLedgers()->create([
                'user_id' => $request->user()->id,
                'delta_quantity' => $delta,
                'entry_type' => $request['entry_type']
            ]);

            return $stock;
        });

        return $this->success(
            $stock,
            'Stock created',
            201
        );
    }
}
