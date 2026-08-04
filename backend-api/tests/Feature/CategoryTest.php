<?php

use App\Models\Category;

function createCategory(array $attributes = []): Category
{
    return Category::factory()->create($attributes);
}

beforeEach(function () {
    actingAsRole(Roles::Admin);
});

test('a category can be created', function () {
    $category = [
        'name' => 'Category',
    ];

    $response = $this->postJson(route('category.store'), $category);

    $response->assertStatus(201)
            ->assertjsonStructure([
                'message',
                'data' => ['id', 'name', 'slug', 'parent_id']
            ]);

    $this->assertDatabaseHas('categories', [
        'name' => $category['name']
    ]);
});

test('a category cannot be created with missing fields', function () {
    $category = [
        'name' => '',
    ];

    $response = $this->postJson(route('category.store'), $category);

    $response->assertStatus(422)
            ->assertJsonValidationErrors(['name']);
});

test('a sub-category can be applied to category', function () {
    $category = createCategory(['name' => 'Category']);

    $subCategoryPayload = [
        'name' => 'Laptop',
        'parent_id' => $category->id
    ];

    $this->postJson(route('category.store'), $subCategoryPayload);

    $subCategory = Category::where('name', $subCategoryPayload['name'])->first();

    expect($subCategory->parent_id)->toBe($category->id);
});

describe('any product category is not allowed to apply its id to the parent_id column', function () {
    test('a category is not allowed to apply its id to the parent_id column', function () {
        $category = createCategory();

        $categoryUpdatePayload = [
            'name' => $category->name,
            'parent_id' => $category->id
        ];

        $response = $this->patchJson(route('category.update', $category), $categoryUpdatePayload);

        $response->assertStatus(422)
                ->assertJsonValidationErrors(['parent_id']);

        $category = Category::where('name', $categoryUpdatePayload['name'])->first();
        expect($category->parent_id)->not->toBe($category->id);
    });
    
    test('a sub-category is not allowed to apply its id to the parent_id column', function () {
        $category = createCategory();

        $subCategoryPayload = [
            'name' => 'Laptop',
            'parent_id' => $category->id
        ];

        $this->postJson(route('category.store'), $subCategoryPayload);

        $subCategory = Category::where('name', $subCategoryPayload['name'])->first();

        $subCategoryUpdatePayload = [
            'name' => $subCategory->name,
            'parent_id' => $subCategory->id
        ];

        $response = $this->patchJson(route('category.update', $subCategory), $subCategoryUpdatePayload);

        $response->assertStatus(422)
                ->assertJsonValidationErrors(['parent_id']);

        expect($subCategory->fresh()->parent_id)->not->toBe($subCategory->id);
    });
});

test('creating a child category with a valid parent_id correctly establishes the relationship', function () {
    $parent = createCategory();

    $child = createCategory([
        'parent_id' => $parent->id
    ]);

    expect($child->parent->name)->toBe($parent->name);
    expect($parent->children->first()->name)->toBe($child->name);
});

test('a category slug is generated automatically from the name', function () {
    $categoryPayload = ['name' => 'Men Shoes'];

    $response = $this->postJson(route('category.store'), $categoryPayload);

    $response->assertStatus(201);

    $this->assertDatabaseHas('categories', [
        'name' => 'Men Shoes',
        'slug' => 'men-shoes',
    ]);
});

test('a category can be fetched with its category slug', function () {
    $category = createCategory();

    $response = $this->getjson(route('category.show', $category->slug));

    $response->assertStatus(200)
            ->assertJsonPath('data.slug', $category->slug);
});

test('category slug automatically provides unique slug for creating category with existing slug', function () {
    $category1 = createCategory(['name' => 'Men Shoes']);
    $category2 = createCategory(['name' => 'Men Shoes']);

    expect($category1->slug)->not->toBe($category2->slug);
});

test('a parent category can have multiple children', function () {
    $parent = createCategory(['name' => 'Electronics']);

    createCategory(['name' => 'Laptops', 'parent_id' => $parent->id]);
    createCategory(['name' => 'Smartphones', 'parent_id' => $parent->id]);

    expect($parent->children)->toHaveCount(2);
    expect($parent->children->pluck('name'))->toContain('Laptops', 'Smartphones');
});

test('deleting a parent category deletes its sub categories as well', function () {
    $parent1 = createCategory();
    $parent2 = createCategory();
    $child1 = createCategory(['parent_id' => $parent2->id]);
    $child2 = createCategory(['parent_id' => $child1->id]);

    expect(Category::all()->count())->toBe(4);

    $response = $this->deleteJson(route('category.destroy', $parent2->slug));
    $response->assertStatus(200);

    $this->assertDatabaseMissing('categories', ['id' => $parent2->id]);
    $this->assertDatabaseMissing('categories', ['id' => $child1->id]);
    $this->assertDatabaseMissing('categories', ['id' => $child2->id]);

    $this->assertDatabaseHas('categories', ['id' => $parent1->id]);
});

test('category list can be displayed with nested children', function () {
    $parent1 = createCategory(['name' => 'Electronics']);
    $child1 = createCategory(['name' => 'Laptops', 'parent_id' => $parent1->id]);
    $parent2 = createCategory(['name' => 'Apparel']);

    $response = $this->getJson(route('category.index'));
    
    $response->assertStatus(200)
            ->assertJsonStructure([
                'message',
                'data' => [
                    '*' => [
                        'id',
                        'name',
                        'slug',
                        'parent_id',
                        'children' => [
                            '*' => [
                                'id',
                                'name',
                                'slug',
                                'parent_id'
                            ]
                        ]
                    ]
                ]
            ]);

    $response->assertJsonCount(2, 'data');

    expect($response->json('data.0.children.0.name'))->toBe('Laptops');
})->only();