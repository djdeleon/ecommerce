<?php

use App\Models\Variant;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;

test('automatic logging on price update', function () {
    $variant = Variant::factory()->create();

    $this->actingAs($variant->product->vendor->user, 'sanctum')
        ->putJson(route('variants.update', [$variant->product_id, $variant]), [
            'sku' => $variant->sku,
            'price' => '200',
        ])
        ->assertOk();

    expect($variant->historyLogs->pluck('action'))->toContain('INSERT', 'UPDATE');

    $updatedVariant = $variant->fresh();
    $updatedLog = $updatedVariant->historyLogs->where('action', 'UPDATE')->first();

    expect($updatedVariant->price->getAmount())->toBe(bcmul($updatedLog->new_data['price'], 10000, 0));
    expect($updatedLog->changed_by_id)->toBe($updatedVariant->product->vendor->user_id);
})->only();

test('history log entries are strictly immutable in postgresql', function () {
    $variant = Variant::factory()->create();

    $log = $variant->historyLogs()->first();

    $this->expectException(QueryException::class);
    DB::statement("UPDATE audit_trail.history_logs SET action = 'HACKED' WHERE id = ?", [$log->id]);
})->only();