<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CreateProductRequest;
use App\Http\Requests\UpdateProductRequest;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use App\Traits\HttpResponses;

class ProductController extends Controller
{
    use HttpResponses;

    public function store(CreateProductRequest $request)
    {
        $product = $request->user()->vendor->products()->create($request->validated());

        $product->load('category');

        return $this->success(
            new ProductResource($product),
            'Product created',
            201
        );
    }

    public function update(UpdateProductRequest $request, Product $product)
    {
        $product->update($request->validated());
        
        $product->load('category');

        return $this->success(
            new ProductResource($product),
            'Product updated',
            200,
        );
    }
}
