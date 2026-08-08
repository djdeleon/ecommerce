<?php

use App\Models\Variant;

test('automatic logging on price update', function () {
    $variant = Variant::factory()->create();

    $this->actingAs($variant->product->vendor->user, 'sanctum')
        ->putJson(route('variants.update', [$variant->product_id, $variant]), [
            'sku' => $variant->sku,
            'price' => '200',
        ])
        ->assertOk();
});