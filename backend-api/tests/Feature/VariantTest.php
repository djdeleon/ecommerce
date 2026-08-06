<?php

use App\Models\Product;
use App\Models\Variant;

test('a product can have variants', function () {
    $product = Product::factory()->create();
    $payload = [
        'product_id' => $product->id,
        'sku' => $product->name . '-sku',
        'price' => 100.00
    ];

    $this->actingAs($product->vendor->user, 'sanctum')
        ->postJson(route('variants.store', $product), $payload)
        ->assertCreated();
})->only();

test('creating a producting variant with same SKU is not allowed', function () {
    $variantA = Variant::factory()->create();
    $variantB = [
        'product_id' => $variantA->product->id,
        'sku' => $variantA->sku,
        'price' => 100.00,
    ];

    $this->actingAs($variantA->product->vendor->user, 'sanctum')
        ->postJson(route('variants.store', $variantA->product), $variantB)
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['sku']);
})->only();