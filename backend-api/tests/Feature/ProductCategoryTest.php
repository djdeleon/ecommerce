<?php

use App\Models\ProductCategory;

function createCategory()
{
    return 'create category...';
}

function createSubCategory()
{
    return 'create sub-category...';
}

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
});

test('a category cannot be created with missing fields', function () {
    actingAsRole(Roles::Admin);

    $category = [
        'name' => '',
    ];

    $response = $this->postJson(route('category.store'), $category);

    $response->assertStatus(422)
            ->assertJsonValidationErrors(['name']);
});

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
});

describe('any product category is not allowed to apply its id to the parent_id column', function () {
    test('a category is not allowed to apply its id to the parent_id column', function () {
        actingAsRole(Roles::Admin);
        
        $categoryPayload = [
            'name' => 'Electronics',
        ];

        $this->postJson(route('category.store'), $categoryPayload);

        $category = ProductCategory::where('name', $categoryPayload['name'])->first();

        $categoryUpdatePayload = [
            'name' => $category->name,
            'parent_id' => $category->id
        ];

        $response = $this->patchJson(route('category.update', $category), $categoryUpdatePayload);

        $response->assertStatus(422)
                ->assertJsonValidationErrors(['parent_id']);

        $category = ProductCategory::where('name', $categoryUpdatePayload['name'])->first();
        expect($category->parent_id)->not->toBe($category->id);
    });
    
    test('a sub-category is not allowed to apply its id to the parent_id column', function () {
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

        $subCategoryUpdatePayload = [
            'name' => $subCategory->name,
            'parent_id' => $subCategory->id
        ];

        $response = $this->patchJson(route('category.update', $subCategory), $subCategoryUpdatePayload);

        $response->assertStatus(422)
                ->assertJsonValidationErrors(['parent_id']);

        $subCategory = ProductCategory::where('name', $subCategoryPayload['name'])->first();
        expect($subCategory->parent_id)->not->toBe($subCategory->id);
    });
});
