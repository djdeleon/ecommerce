<?php

use App\Models\ProductCategory;

test('a category can be created', function () {
    actingAsRole(Roles::Admin);

    $category = [
        'name' => 'Electronics',
    ];

    $response = $this->postJson(route('category.store'), $category);

    $response->assertStatus(200)
            ->assertJsonPath('message', 'Product Category created.');

    $this->assertDatabaseHas('product_categories', [
        'name' => $category['name']
    ]);
})->only();

test('a category cannot be created with missing fields', function () {
    actingAsRole(Roles::Admin);

    $category = [
        'name' => '',
    ];

    $response = $this->postJson(route('category.store'), $category);

    $response->assertStatus(422)
            ->assertJsonValidationErrors(['name']);
})->only();

test('a sub-category can be applied to category', function () {
    actingAsRole(Roles::Admin);

    $categoryPayload = [
        'name' => 'Electronics',
    ];

    $this->postJson(route('category.store'), $categoryPayload);

    $category = ProductCategory::where('name', $categoryPayload['name'])->first();

    $subCategoryPayload = [
        'name' => 'Laptop',
        'parent_id' => $category->id
    ];

    $this->postJson(route('category.store'), $subCategoryPayload);

    $subCategory = ProductCategory::where('name', $subCategoryPayload['name'])->first();

    expect($subCategory->parent_id)->toBe($category->id);
})->only();