<?php

use App\Models\Variant;
use App\Models\Vendor;

describe('inventory stocks store validation testing', function () {
    test('inventory validation rule', function (array $invalidPayload, string $expectedErrorKey) {
        $vendor = Vendor::factory()
            ->hasWarehouses(1)
            ->hasProducts(1)
            ->create();
        $variant = Variant::factory()
            ->for($vendor->products->first())
            ->create();

        if (array_key_exists('facility_id', $invalidPayload)) {
            $invalidPayload['facility_id'] = $vendor->warehouses->first()->id;
        }

        $this->actingAs($vendor->user, 'sanctum')
            ->postJson(route('inventory-stocks.store', $variant), $invalidPayload)
            ->assertUnprocessable()
            ->assertJsonValidationErrors([$expectedErrorKey]);
    })->with([
        'missing facility type' => [
            ['facility_id' => 1, 'delta' => 5, 'entry_type' => 'restock'], 
            'facility_type'
        ],
        'passing integer facility type' => [
            ['facility_id' => 1, 'delta' => 5, 'entry_type' => 'restock', 'facility_type' => 5], 
            'facility_type'
        ],
        'passing non inventorable facility type' => [
            ['facility_id' => 1, 'delta' => 5, 'entry_type' => 'restock', 'facility_type' => 'non-inventorable entity'], 
            'facility_type'
        ],

        'missing delta' => [
            ['facility_id' => 1, 'facility_type' => 'warehouse', 'entry_type' => 'restock'], 
            'delta'
        ],
        // 'passing string delta' => [
        //     ['delta' => '5', 'facility_id' => 1, 'facility_type' => 'warehouse', 'entry_type' => 'restock'], 
        //     'delta'
        // ],

        'missing entry type' => [
            ['facility_type' => 'warehouse', 'facility_id' => 1, 'delta' => 5], 
            'entry_type'
        ],
        'null entry type' => [
            ['entry_type' => null, 'facility_type' => 'warehouse', 'facility_id' => 1, 'delta' => 5], 
            'entry_type'
        ],
        'empty string entry type' => [
            ['entry_type' => '', 'facility_type' => 'warehouse', 'facility_id' => 1, 'delta' => 5], 
            'entry_type'
        ],
        'passing array payload to entry type' => [
            ['entry_type' => ['invalid_type'], 'facility_type' => 'warehouse', 'facility_id' => 1, 'delta' => 5], 
            'entry_type'
        ],
        'passing non entry type value' => [
            ['entry_type' => 'damaged', 'facility_type' => 'warehouse', 'facility_id' => 1, 'delta' => 5], 
            'entry_type'
        ],
    ]);

    test('stock cannot be adjusted below zero', function () {
        $vendor = Vendor::factory()
            ->hasWarehouses(1)
            ->hasProducts(1)
            ->create();
        $warehouse = $vendor->warehouses->first();
        $product = $vendor->products->first();
        $variant = Variant::factory()
            ->for($product)
            ->create();

        $payload = [
            'facility_type' => 'warehouse',
            'facility_id' => $warehouse->id,
            'delta' => -10,
            'entry_type' => 'restock',
        ];

        $this->actingAs($variant->product->vendor->user, 'sanctum')
            ->postJson(route('inventory-stocks.store', $variant), $payload)
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'delta' => 'Insufficient stock available to perform this adjustment.'
            ]);
    });
});