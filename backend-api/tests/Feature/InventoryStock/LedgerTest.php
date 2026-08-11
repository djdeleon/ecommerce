<?php

use App\Models\InventoryLedger;
use App\Models\InventoryStock;
use App\Models\User;

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
});

test('inventory ledger relationships resolve stock and actor correctly', function () {
    $user = User::factory()->create();
    $stock = InventoryStock::factory()->create();

    $ledger = InventoryLedger::factory()->create([
        'inventory_stock_id' => $stock->id,
        'user_id' => $user->id,
    ]);

    expect($ledger->inventoryStock->id)->toBe($stock->id)
        ->and($ledger->actor->id)->toBe($user->id)
        ->and($stock->inventoryLedgers->first()->id)->toBe($ledger->id);
});