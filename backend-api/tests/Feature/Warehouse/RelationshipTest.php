<?php

use App\Models\Warehouse;

test('warehouse belongs to vendor and cascades on delete', function () {
    $warehouse = Warehouse::factory()->create();

    expect($warehouse->vendor->id)->toBe($warehouse->vendor_id);

    $warehouse->vendor->delete();
    $this->assertDatabaseMissing('warehouses', ['id' => $warehouse->id]);
});