<?php

use App\Models\Vendor;
use App\Models\Warehouse;

test('a vendor can create its own warehouse', function () {
    $vendor = Vendor::factory()->create();

    $this->actingAs($vendor->user, 'sanctum')
        ->postJson(route('warehouses.store', $vendor), [
            'address' => 'Warehouse 123 St.'
        ])
        ->assertCreated();
    
    $this->assertDatabaseHas('warehouses', ['address' => $vendor->warehouses()->first()->address]);
});

test('warehouse belongs to vendor and cascades on delete', function () {
    $warehouse = Warehouse::factory()->create();

    expect($warehouse->vendor->id)->toBe($warehouse->vendor_id);

    $warehouse->vendor->delete();
    $this->assertDatabaseMissing('warehouses', ['id' => $warehouse->id]);
});