<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CreateInventoryStockRequest;
use App\Models\FulfillmentHub;
use App\Models\Product;
use App\Models\Variant;
use App\Models\Vendor;
use App\Models\Warehouse;
use App\Services\InventoryStockService;
use App\Traits\HttpResponses;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Http\JsonResponse;

class InventoryStockController extends Controller
{
    use HttpResponses;

    public function index(): JsonResponse
    {
        $user = auth()->user();

        if ($user->hasRole('admin')) {
            $products = Vendor::with([
                    'products:id,vendor_id,name',
                    'products.variants:id,product_id,sku',
                    'products.variants.inventoryStocks' => function ($q) {
                        $q->select('id', 'variant_id', 'quantity_available', 'quantity_reserved', 'inventorable_id', 'inventorable_type')
                            ->with(['inventorable' => function (MorphTo $morphTo) {
                                $morphTo->constrain([
                                    Warehouse::class => fn($q) => $q->select('id', 'address'),
                                    FulfillmentHub::class => fn($q) => $q->select('id', 'name'),
                                ]);
                            }]);
                    }
            ])->paginate(15);
        } else {
            $products = Product::where('vendor_id', $user->vendor->id)
                    ->with([
                        'variants:id,product_id,sku',
                        'variants.inventoryStocks' => function ($q) {
                            $q->select('id', 'variant_id', 'quantity_available', 'quantity_reserved', 'inventorable_id', 'inventorable_type')
                                ->with(['inventorable' => function (MorphTo $morphTo) {
                                    $morphTo->constrain([
                                        Warehouse::class => fn($q) => $q->select('id', 'address'),
                                        FulfillmentHub::class => fn($q) => $q->select('id', 'name'),
                                    ]);
                                }]);
                        }
                    ])
                    ->select('id', 'vendor_id', 'name')
                    ->paginate(15);
        }

        return $this->success(
            $products,
            'Inventory Stock tree retrieved'
        );
    }

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
