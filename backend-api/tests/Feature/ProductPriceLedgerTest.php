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

    expect($variant->priceLedgers->pluck('action'))->toContain('INSERT', 'UPDATE');

    $updatedVariant = $variant->fresh();
    $updatedLog = $updatedVariant->priceLedgers->where('action', 'UPDATE')->first();

    expect($updatedVariant->price->getAmount())->toBe(bcmul($updatedLog->new_price, 10000, 0));
    expect($updatedLog->changed_by_id)->toBe($updatedVariant->product->vendor->user_id);
});

test('history log entries are strictly immutable in postgresql', function () {
    $variant = Variant::factory()->create();

    $log = $variant->priceLedgers()->first();

    $this->expectException(QueryException::class);
    DB::statement("UPDATE product_price_ledgers SET action = 'HACKED' WHERE id = ?", [$log->id]);
});

test('no history log for unchanged price', function () {
    $variant = Variant::factory()->create(['price' => '100.00']);

    $this->actingAs($variant->product->vendor->user, 'sanctum')
    ->putJson(route('variants.update', [$variant->product_id, $variant]), [
        'sku' => $variant->sku,
        'price' => '100.00',
    ])
    ->assertOk();

    expect($variant->priceLedgers->pluck('action'))->not->toContain('UPDATE');
    expect($variant->priceLedgers)->toHaveCount(1);
});