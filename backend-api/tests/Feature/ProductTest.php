<?php

use App\Models\Category;
use App\Models\Product;
use App\Models\Vendor;

describe('product creation test', function () {
    test('a vendor can create a product', function () {
        $category = Category::factory()->create();
        $vendor = Vendor::factory()->create();

        $payload = [
            'category_id' => $category->id,
            'name' => 'Product 1',
            'slug' => 'product-1',
            'description' => 'This is a product description.',
            'status' => 'active'
        ];

        $this->actingAs($vendor->user, 'sanctum')
            ->postJson(route('products.store'), $payload)
            ->assertStatus(201)
            ->assertJsonStructure([
                'message',
                'data' => [
                    'id',
                    'name',
                    'slug',
                    'description',
                    'status',
                    'category',
                ]
            ]);
    });
});

describe('relationship test for vendor and product', function () {
    test('a vendor have products', function () {
        $vendor = Vendor::factory()->create();
        $product1 = Product::factory()->create([
            'vendor_id' => $vendor->id
        ]);
        $product2 = Product::factory()->create([
            'vendor_id' => $vendor->id
        ]);
        $product3 = Product::factory()->create([
            'vendor_id' => $vendor->id
        ]);

        expect($vendor->products->pluck('name'))->toContain(
            $product1->name,
            $product2->name,
            $product3->name,
        );
    });
    
    test('a product has a vendor', function () {
        $vendor = Vendor::factory()->create();
        $product = Product::factory()->create([
            'vendor_id' => $vendor->id
        ]);

        expect($product->vendor->name)->toBe($vendor->name);
    });

    test('a product has a category', function () {
            $category = Category::factory()->create();
            $product = Product::factory()->create([
                'category_id' => $category->id
            ]);

            expect($product->category->name)->toBe($category->name);
    });
});


describe('validation test for product creation', function () {
    it('fails if required fields are missing', function () {
        $vendor = Vendor::factory()->create();

        $payload = [
            'category_id' => '',
            'name' => '',
            'description' => '',
            'status' => '',
        ];

        $this->actingAs($vendor->user, 'sanctum')
            ->postJson(route('products.store'), $payload)
            ->assertStatus(422)
            ->assertJsonValidationErrors([
                'category_id',
                'name',
                'status',
            ]);
    });

    test('adjusts the slug if the slug already exists', function () {
        $category = Category::factory()->create();
        $vendor = Vendor::factory()->create();
        $product = Product::factory()->create([
            'vendor_id' => $vendor->id,
            'name' => 'Product 1',
            'slug' => 'product-1',
        ]);

        $payload = [
            'category_id' => $category->id,
            'name' => $product->name,
            'slug' => $product->slug,
            'description' => 'This is a product description.',
            'status' => 'active'
        ];

        $this->actingAs($vendor->user, 'sanctum')
            ->postJson(route('products.store'), $payload)
            ->assertStatus(201);

        $this->assertDatabaseCount('products', 2);
    });
});

describe('product updation test', function () {
    test('a vendor can update its product while others remain unchanged', function () {
        $product = Product::factory()->create([
            'status' => 'draft',
        ]);

        $payload = [
            'name' => 'New Product Name',
        ];
        
        $this->actingAs($product->vendor->user, 'sanctum')
            ->putJson(route('products.update', $product), $payload)
            ->assertStatus(200);

        $product->refresh();

        expect($product->name)->toBe($payload['name']);
        expect($product->status)->toBe('draft');
    });

    test('updating a product name to an existing name generates a unique incremented slug', function () {
        $vendor = Vendor::factory()->create();
        $product1 = Product::factory()->create([
            'vendor_id' => $vendor->id,
            'name' => 'Existing Product',
        ]);
        $product2 = Product::factory()->create([
            'vendor_id' => $vendor->id,
            'name' => 'New Product'
        ]);

        $payload = [
            'name' => 'Existing Product',
        ];

        $this->actingAs($vendor->user, 'sanctum')
            ->putJson(route('products.update', $product2), $payload)
            ->assertStatus(200);
        
        expect($product2->fresh()->slug)->toBe('existing-product-1');
    });

    test('a vendor cannot update a product belonging to another vendor', function () {
        $vendorA = Vendor::factory()->create();
        $vendorB = Vendor::factory()->create();

        $productA = Product::factory()->create([
            'vendor_id' => $vendorA->id
        ]);

        $this->actingAs($vendorB->user, 'sanctum')
            ->putJson(route('products.update', $productA), [
                'name' => 'Stolen Product Name'
            ])
            ->assertStatus(403);

        expect($productA->name)->not->toBe('Stolen Product Name');
    });
});

describe('validation test for product updation', function () {
    it('fails if required fields are change to empty', function () {
        $category = Category::factory()->create();
        $vendor = Vendor::factory()->create();
        $product = Product::factory()->create([
            'vendor_id' => $vendor->id,
            'category_id' => $category->id,
        ]);

        $payload = [
            'name' => '',
        ];

        $this->actingAs($vendor->user, 'sanctum')
            ->putJson(route('products.update', $product), $payload)
            ->assertStatus(422)
            ->assertJsonValidationErrors(['name']);
    });
});