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
});

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
});

test('variant price maintains high precision price decimal 4 without rounding errors', function () {
    $product = Product::factory()->create();
    $highPrecisionPrice = 99.9876;
    
    $payload = [
        'product_id' => $product->id,
        'sku' => $product->name . '-sku',
        'price' => $highPrecisionPrice
    ];

    $this->actingAs($product->vendor->user, 'sanctum')
        ->postJson(route('variants.store', $product), $payload)
        ->assertCreated();

    $variant = $product->variants->first();

    expect((string) $variant->getRawOriginal('price'))->toBe('99.9876');

    expect($variant->price->getAmount())->toBe('999876');
});

it('it validates required fields when creating a variant', function () {
    $product = Product::factory()->create();

    $this->actingAs($product->vendor->user, 'sanctum')
        ->postJson(route('variants.store', $product), [])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['sku', 'price']);
});

it('prevents negative prices', function () {
    $product = Product::factory()->create();

    $payload = [
        'sku' => 'VAR->NEG-1',
        'price' => -10.00,
    ];

    $this->actingAs($product->vendor->user, 'sanctum')
        ->postJson(route('variants.store', $product), $payload)
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['price']);
});

it('prevents non-numeric prices', function () {
    $product = Product::factory()->create();

    $payload = [
        'sku' => 'VAR->NEG-1',
        'price' => 'invalid-price',
    ];

    $this->actingAs($product->vendor->user, 'sanctum')
        ->postJson(route('variants.store', $product), $payload)
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['price']);
});