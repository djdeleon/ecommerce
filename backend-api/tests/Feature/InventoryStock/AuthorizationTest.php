<?php

use App\Models\User;
use App\Models\Variant;
use App\Models\Vendor;

describe('inventory store authentication rule', function () {
    test('only a vendor can adjust the stocks of its product variant stocks', function (string $role) {
        $vendor = Vendor::factory()
            ->hasWarehouses(1)
            ->hasProducts(1)
            ->create();
        $variant = Variant::factory()
            ->for($vendor->products->first())
            ->create();

        $randomUser = User::factory()->create();
        $randomUser->assignRole($role);

        $payload = [
            'facility_type' => 'warehouse',
            'facility_id' => $vendor->warehouses->first()->id,
            'delta' => 50,
            'entry_type' => 'restock',
        ];

        $this->actingAs($randomUser, 'sanctum')
            ->postJson(route('inventory-stocks.store', $variant), $payload)
            ->assertForbidden();
    })->with([
        'customer role' => 'customer',
        'driver role' => 'driver',
    ]);
});

describe('inventory store authorization rule', function () {
    test('a vendor cannot adjust stock for another vendors product', function () {
        $vendorA = Vendor::factory()
            ->hasWarehouses(1)
            ->hasProducts(1)
            ->create();
        $warehouse = $vendorA->warehouses->first();
        $product = $vendorA->products->first();
        $variant = Variant::factory()
            ->for($product)
            ->create();
        
        $vendorB = Vendor::factory()->create();

        $payload = [
            'facility_type' => 'warehouse',
            'facility_id' => $warehouse->id,
            'delta' => 50,
            'entry_type' => 'restock',
        ];

        $this->actingAs($vendorB->user, 'sanctum')
            ->postJson(route('inventory-stocks.store', $variant), $payload)
            ->assertForbidden();
    });

    test('a vendor cannot adjust stock for another warehouse', function () {
        $vendorA = Vendor::factory()
            ->hasWarehouses(1)
            ->hasProducts(1)
            ->create();
        $warehouseA = $vendorA->warehouses->first();
        $productA = $vendorA->products->first();
        $variantA = Variant::factory()
            ->for($productA)
            ->create();

        $vendorB = Vendor::factory()
            ->hasWarehouses(1)
            ->hasProducts(1)
            ->create();
        $warehouseB = $vendorB->warehouses->first();
        $productB = $vendorB->products->first();
        $variantB = Variant::factory()
            ->for($productB)
            ->create();
        
        $payload = [
            'facility_type' => 'warehouse',
            'facility_id' => $warehouseA->id,
            'delta' => 50,
            'entry_type' => 'restock',
        ];

        $this->actingAs($vendorB->user, 'sanctum')
            ->postJson(route('inventory-stocks.store', $variantB), $payload)
            ->assertForbidden();
    });
});