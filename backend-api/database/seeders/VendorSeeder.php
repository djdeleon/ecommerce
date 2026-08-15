<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\FulfillmentHub;
use App\Models\InventoryStock;
use App\Models\Product;
use App\Models\Variant;
use App\Models\Vendor;
use App\Models\Warehouse;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class VendorSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        [$fulfillmentHubA, $fulfillmentHubB, $fulfillmentHubC] = FulfillmentHub::factory(3)->create();

        $vendorA = Vendor::factory()->create(['shop_name' => 'Vendor A']);
        [$vendorAWarehouseA, $vendorAWarehouseB, $vendorAWarehouseC] = Warehouse::factory(3)->for($vendorA)->create();

        $vendorAProducts = Product::factory(3)->for($vendorA)->create();
            $vendorAProductA = $vendorA->products()->first();
                $vendorAProductAVariants = Variant::factory(3)->for($vendorAProductA)->create();
                $vendorAProductAVariantA = $vendorAProductAVariants->first();
                    $vendorAProductAVariantAWarehouseStock = InventoryStock::factory()->for($vendorAProductAVariantA)->create(['inventorable_type' => Warehouse::class, 'inventorable_id' => $vendorAWarehouseA->id,]);
                    $vendorAProductAVariantAFulfillmentHubStock = InventoryStock::factory()->for($vendorAProductAVariantA)->create(['inventorable_type' => FulfillmentHub::class, 'inventorable_id' => $fulfillmentHubA->id,]);
                $vendorAProductAVariantB = $vendorAProductAVariants->skip(1)->first();
                    $vendorAProductAVariantBWarehouseStock = InventoryStock::factory()->for($vendorAProductAVariantB)->create(['inventorable_type' => Warehouse::class, 'inventorable_id' => $vendorAWarehouseA->id,]);
                    $vendorAProductAVariantBFulfillmentHubStock = InventoryStock::factory()->for($vendorAProductAVariantB)->create(['inventorable_type' => FulfillmentHub::class, 'inventorable_id' => $fulfillmentHubA->id,]);
                $vendorAProductAVariantC = $vendorAProductAVariants->skip(2)->first();
                    $vendorAProductAVariantCWarehouseStock = InventoryStock::factory()->for($vendorAProductAVariantC)->create(['inventorable_type' => Warehouse::class, 'inventorable_id' => $vendorAWarehouseC->id,]);
                    $vendorAProductAVariantCFulfillmentHubStock = InventoryStock::factory()->for($vendorAProductAVariantC)->create(['inventorable_type' => FulfillmentHub::class, 'inventorable_id' => $fulfillmentHubA->id,]);
            $vendorAProductB = $vendorA->products()->skip(1)->first();
                $vendorAProductBVariants = Variant::factory(3)->for($vendorAProductB)->create();
                    $vendorAProductBVariantA = $vendorAProductBVariants->first();
                    $vendorAProductAVariantAWarehouseStock = InventoryStock::factory()->for($vendorAProductBVariantA)->create(['inventorable_type' => Warehouse::class, 'inventorable_id' => $vendorAWarehouseA->id,]);
                $vendorAProductBVariantB = $vendorAProductBVariants->skip(1)->first();
                    $vendorAProductAVariantBFulfillmentHubStock = InventoryStock::factory()->for($vendorAProductBVariantB)->create(['inventorable_type' => FulfillmentHub::class, 'inventorable_id' => $fulfillmentHubB->id,]);
                $vendorAProductBVariantC = $vendorAProductBVariants->skip(2)->first();
            $vendorAProductC = $vendorA->products()->skip(2)->first();
                $vendorAProductCVariants = Variant::factory(3)->for($vendorAProductC)->create();
                $vendorAProductCVariantA = $vendorAProductCVariants->first();
                    $vendorAProductCVariantAWarehouseStockA = InventoryStock::factory()->for($vendorAProductCVariantA)->create(['inventorable_type' => Warehouse::class, 'inventorable_id' => $vendorAWarehouseB->id,]);
                    $vendorAProductCVariantAWarehouseStockB = InventoryStock::factory()->for($vendorAProductCVariantA)->create(['inventorable_type' => Warehouse::class, 'inventorable_id' => $vendorAWarehouseA->id,]);
                    $vendorAProductCVariantAFullfillmentHubStock = InventoryStock::factory()->for($vendorAProductCVariantA)->create(['inventorable_type' => FulfillmentHub::class, 'inventorable_id' => $fulfillmentHubC->id,]);
                $vendorAProductCVariantB = $vendorAProductCVariants->skip(1)->first();
                    $vendorAProductCVariantBFulfillmentHubStock = InventoryStock::factory()->for($vendorAProductCVariantB)->create(['inventorable_type' => FulfillmentHub::class, 'inventorable_id' => $fulfillmentHubC->id,]);
                $vendorAProductCVariantC = $vendorAProductCVariants->skip(2)->first();

        $vendorB = Vendor::factory()->create(['shop_name' => 'Vendor B']);
        [$vendorBWarehouseA, $vendorBWarehouseB, $vendorBWarehouseC] = Warehouse::factory(3)->for($vendorB)->create();
        
        $vendorBProducts = Product::factory(3)->for($vendorB)->create();
            $vendorBProductA = $vendorB->products()->first();
                $vendorBProductAVariants = Variant::factory(3)->for($vendorBProductA)->create();
                $vendorBProductAVariantA = $vendorBProductAVariants->first();
                    $vendorBProductAVariantAWarehouseStock = InventoryStock::factory()->for($vendorBProductAVariantA)->create(['inventorable_type' => Warehouse::class, 'inventorable_id' => $vendorBWarehouseB->id,]);
                    $vendorBProductAVariantAFullfillmentHubStock = InventoryStock::factory()->for($vendorBProductAVariantA)->create(['inventorable_type' => FulfillmentHub::class, 'inventorable_id' => $fulfillmentHubA->id,]);
                $vendorBProductAVariantB = $vendorBProductAVariants->skip(1)->first();
                    $vendorBProductAVariantBFulfillmentHubStock = InventoryStock::factory()->for($vendorBProductAVariantB)->create(['inventorable_type' => FulfillmentHub::class, 'inventorable_id' => $fulfillmentHubA->id,]);
                $vendorBProductAVariantC = $vendorBProductAVariants->skip(2)->first();
            $vendorBProductB = $vendorB->products()->skip(1)->first();
                $vendorBProductBVariants = Variant::factory(3)->for($vendorBProductB)->create();
                $vendorBProductBVariantA = $vendorBProductBVariants->first();
                    $vendorBProductBVariantAWarehouseStock = InventoryStock::factory()->for($vendorBProductBVariantA)->create(['inventorable_type' => Warehouse::class, 'inventorable_id' => $vendorBWarehouseA->id,]);
                    $vendorBProductBVariantAFulfillmentHubStock = InventoryStock::factory()->for($vendorBProductBVariantA)->create(['inventorable_type' => FulfillmentHub::class, 'inventorable_id' => $fulfillmentHubA->id,]);
                $vendorBProductBVariantB = $vendorBProductBVariants->skip(1)->first();
                    $vendorBProductBVariantBWarehouseStock = InventoryStock::factory()->for($vendorBProductBVariantB)->create(['inventorable_type' => Warehouse::class, 'inventorable_id' => $vendorBWarehouseB->id,]);
                    $vendorBProductBVariantBFulfillmentHubStock = InventoryStock::factory()->for($vendorBProductBVariantB)->create(['inventorable_type' => FulfillmentHub::class, 'inventorable_id' => $fulfillmentHubA->id,]);
                $vendorBProductBVariantC = $vendorBProductBVariants->skip(2)->first();
                    $vendorBProductBVariantCWarehouseStock = InventoryStock::factory()->for($vendorBProductBVariantC)->create(['inventorable_type' => Warehouse::class, 'inventorable_id' => $vendorBWarehouseC->id,]);
                    $vendorBProductBVariantCFulfillmentHubStock = InventoryStock::factory()->for($vendorBProductBVariantC)->create(['inventorable_type' => FulfillmentHub::class, 'inventorable_id' => $fulfillmentHubA->id,]);
            $vendorBProductC = $vendorB->products()->skip(2)->first();
                $vendorBProductCVariants = Variant::factory(3)->for($vendorBProductC)->create();
                $vendorBProductCVariantA = $vendorBProductCVariants->first();
                    $vendorBProductAVariantBFulfillmentHubStock = InventoryStock::factory()->for($vendorBProductCVariantA)->create(['inventorable_type' => FulfillmentHub::class, 'inventorable_id' => $fulfillmentHubC->id,]);

        $vendorC = Vendor::factory()->create(['shop_name' => 'Vendor C']);
        $vendorCWarehouses = Warehouse::factory(1)->for($vendorC)->create();
        $vendorCWarehouse = $vendorCWarehouses->first();
        $vendorCProducts = Product::factory()->for($vendorC)->create();
            $vendorCProductA = $vendorC->products()->first();
                $vendorCProductAVariants = Variant::factory()->for($vendorCProductA)->create();
                $vendorCProductAVariantA = $vendorCProductAVariants->first();
                    $vendorCProductAVariantAWarehouseStock = InventoryStock::factory()->for($vendorCProductAVariantA)->create(['inventorable_type' => Warehouse::class, 'inventorable_id' => $vendorCWarehouse->id,]);
    }
}
