<?php

namespace Database\Seeders;

use App\Models\FulfillmentHub;
use App\Models\InventoryStock;
use App\Models\Product;
use App\Models\Variant;
use App\Models\Vendor;
use App\Models\Warehouse;
use Illuminate\Database\Seeder;

class VendorTwoSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 🌐 Platform Fulfillment Hubs
        $hubs = FulfillmentHub::factory(3)->create();
        $hubA = $hubs[0];
        $hubB = $hubs[1];
        $hubC = $hubs[2];

        // ==========================================
        // 🏢 VENDOR A SEEDING
        // ==========================================
        $vendorA = Vendor::factory()->create(['shop_name' => 'Vendor A']);
        $vAWarehouses = Warehouse::factory(3)->for($vendorA)->create();
        $vAWhA = $vAWarehouses[0];
        $vAWhB = $vAWarehouses[1];
        $vAWhC = $vAWarehouses[2];

        $vAProducts = Product::factory(3)->for($vendorA)->create();

        // Product A (Variants + Stocks)
        $vAProdAVariants = Variant::factory(3)->for($vAProducts[0])->create();
        InventoryStock::factory()->for($vAProdAVariants[0])->create(['inventorable_type' => Warehouse::class, 'inventorable_id' => $vAWhA->id]);
        InventoryStock::factory()->for($vAProdAVariants[0])->create(['inventorable_type' => FulfillmentHub::class, 'inventorable_id' => $hubA->id]);
        InventoryStock::factory()->for($vAProdAVariants[1])->create(['inventorable_type' => Warehouse::class, 'inventorable_id' => $vAWhA->id]);
        InventoryStock::factory()->for($vAProdAVariants[1])->create(['inventorable_type' => FulfillmentHub::class, 'inventorable_id' => $hubA->id]);
        InventoryStock::factory()->for($vAProdAVariants[2])->create(['inventorable_type' => Warehouse::class, 'inventorable_id' => $vAWhA->id]);
        InventoryStock::factory()->for($vAProdAVariants[2])->create(['inventorable_type' => FulfillmentHub::class, 'inventorable_id' => $hubA->id]);

        // Product B (Variants + Stocks)
        $vAProdBVariants = Variant::factory(3)->for($vAProducts[1])->create();
        InventoryStock::factory()->for($vAProdBVariants[0])->create(['inventorable_type' => Warehouse::class, 'inventorable_id' => $vAWhA->id]);
        InventoryStock::factory()->for($vAProdBVariants[1])->create(['inventorable_type' => FulfillmentHub::class, 'inventorable_id' => $hubB->id]);

        // Product C (Variants + Stocks)
        $vAProdCVariants = Variant::factory(3)->for($vAProducts[2])->create();
        InventoryStock::factory()->for($vAProdCVariants[0])->create(['inventorable_type' => Warehouse::class, 'inventorable_id' => $vAWhB->id]);
        InventoryStock::factory()->for($vAProdCVariants[0])->create(['inventorable_type' => Warehouse::class, 'inventorable_id' => $vAWhA->id]);
        InventoryStock::factory()->for($vAProdCVariants[0])->create(['inventorable_type' => FulfillmentHub::class, 'inventorable_id' => $hubC->id]);
        InventoryStock::factory()->for($vAProdCVariants[1])->create(['inventorable_type' => FulfillmentHub::class, 'inventorable_id' => $hubC->id]);


        // ==========================================
        // 🏢 VENDOR B SEEDING
        // ==========================================
        $vendorB = Vendor::factory()->create(['shop_name' => 'Vendor B']);
        $vBWarehouses = Warehouse::factory(3)->for($vendorB)->create();
        $vBWhA = $vBWarehouses[0];
        $vBWhB = $vBWarehouses[1];
        $vBWhC = $vBWarehouses[2]; // Fixed: skip(21) bug!

        $vBProducts = Product::factory(3)->for($vendorB)->create();

        // Product A
        $vBProdAVariants = Variant::factory(3)->for($vBProducts[0])->create();
        InventoryStock::factory()->for($vBProdAVariants[0])->create(['inventorable_type' => Warehouse::class, 'inventorable_id' => $vBWhB->id]);
        InventoryStock::factory()->for($vBProdAVariants[0])->create(['inventorable_type' => FulfillmentHub::class, 'inventorable_id' => $hubA->id]);
        InventoryStock::factory()->for($vBProdAVariants[1])->create(['inventorable_type' => FulfillmentHub::class, 'inventorable_id' => $hubA->id]);

        // Product B (Fixed: assigned to Vendor B's warehouse instead of Vendor A's)
        $vBProdBVariants = Variant::factory(3)->for($vBProducts[1])->create();
        InventoryStock::factory()->for($vBProdBVariants[0])->create(['inventorable_type' => Warehouse::class, 'inventorable_id' => $vBWhA->id]);
        InventoryStock::factory()->for($vBProdBVariants[0])->create(['inventorable_type' => FulfillmentHub::class, 'inventorable_id' => $hubA->id]);
        InventoryStock::factory()->for($vBProdBVariants[1])->create(['inventorable_type' => Warehouse::class, 'inventorable_id' => $vBWhA->id]);
        InventoryStock::factory()->for($vBProdBVariants[1])->create(['inventorable_type' => FulfillmentHub::class, 'inventorable_id' => $hubA->id]);
        InventoryStock::factory()->for($vBProdBVariants[2])->create(['inventorable_type' => Warehouse::class, 'inventorable_id' => $vBWhA->id]);
        InventoryStock::factory()->for($vBProdBVariants[2])->create(['inventorable_type' => FulfillmentHub::class, 'inventorable_id' => $hubA->id]);

        // Product C
        $vBProdCVariants = Variant::factory(3)->for($vBProducts[2])->create();
        InventoryStock::factory()->for($vBProdCVariants[0])->create(['inventorable_type' => FulfillmentHub::class, 'inventorable_id' => $hubC->id]);


        // ==========================================
        // 🏢 VENDOR C SEEDING
        // ==========================================
        $vendorC = Vendor::factory()->create(['shop_name' => 'Vendor C']);
        $vCWh = Warehouse::factory()->for($vendorC)->create();

        $vCProduct = Product::factory()->for($vendorC)->create();
        $vCVariant = Variant::factory()->for($vCProduct)->create();
        InventoryStock::factory()->for($vCVariant)->create(['inventorable_type' => Warehouse::class, 'inventorable_id' => $vCWh->id]);
    }
}