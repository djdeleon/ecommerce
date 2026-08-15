<?php

use App\Models\InventoryLedger;
use App\Models\InventoryStock;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;

test('inventory ledger is strictly immutable in postgresql', function (string $query) {
    $ledger = InventoryLedger::factory()->create();

    $this->expectException(QueryException::class);
    
    DB::statement($query, [$ledger->id]);
})->with([
    'update' => "UPDATE inventory_ledgers SET action = 'HACKED' WHERE id = ?",
    'delete' => 'DELETE FROM inventory_ledgers WHERE id = ?',
]);

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

test('chronological audit history can be retrieved from stock model', function () {
    $stock = InventoryStock::factory()->create();

    InventoryLedger::factory()->create([
        'inventory_stock_id' => $stock->id,
        'entry_type' => 'restock',
        'delta_quantity' => 100,
        'created_at' => now()->subHours(2),
    ]);

    InventoryLedger::factory()->create([
        'inventory_stock_id' => $stock->id,
        'entry_type' => 'reservation',
        'delta_quantity' => -10,
        'created_at' => now()->subHour(),
    ]);

    $history = $stock->refresh()->inventoryLedgers;

    expect($history)->toHaveCount(2)
        ->and($history->pluck('entry_type')->toArray())->toBe(['restock', 'reservation']);
});