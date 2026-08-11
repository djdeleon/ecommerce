<?php

namespace App\Services;

use App\Models\FulfillmentHub;
use App\Models\InventoryStock;
use App\Models\Variant;
use App\Models\Warehouse;
use Illuminate\Support\Facades\DB;

class InventoryStockService
{
    public function adjust(array $data, int $userId, Variant $variant): InventoryStock
    {
        $facilityType = $data['facility_type'] === 'warehouse' ? Warehouse::class : FulfillmentHub::class;
        $delta = (int) $data['delta'];

        return DB::transaction(function () use ($data, $variant, $facilityType, $userId, $delta) {
            $stock = $variant->inventoryStock()->firstOrCreate([
                'inventorable_type' => $facilityType,
                'inventorable_id' => $data['facility_id'],
            ], [
                'quantity_available' => 0,
                'quantity_reserved' => 0,
            ]);

            $stock->increment('quantity_available', $delta);

            $stock->inventoryLedgers()->create([
                'user_id' => $userId,
                'delta_quantity' => $delta,
                'entry_type' => $data['entry_type'] ?? 'restock'
            ]);

            return $stock;
        });
    }
}