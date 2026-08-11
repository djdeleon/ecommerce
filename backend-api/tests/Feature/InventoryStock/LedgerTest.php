<?php

use App\Models\InventoryLedger;

test('inventory ledger updating is strictly prevented by immutability guard', function () {
    $ledger = InventoryLedger::factory()->create(['delta_quantity' => 10]);

    expect(function () use ($ledger) {
        $ledger->update(['delta_quantity' => 999]);
    })->toThrow(\LogicException::class, 'Inventory ledger records are strictly immutable and cannot be updated.');
});

test('inventory ledger deletion is strictly prevented by immutability guard', function () {
    $ledger = InventoryLedger::factory()->create();

    expect(function () use ($ledger) {
        $ledger->delete();
    })->toThrow(\LogicException::class, 'Inventory ledger records are strictly immutable and cannot be deleted.');
})->only();