<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CreateProductRequest;
use App\Http\Requests\UpdateProductRequest;
use App\Models\Product;
use App\Traits\HttpResponses;

class ProductController extends Controller
{
    use HttpResponses;

    public function store(CreateProductRequest $request)
    {
        $product = $request->user()->vendor->products()->create($request->validated());

        return $this->success(
            $product,
            'Product created',
            201
        );
    }

    public function update(UpdateProductRequest $request, Product $product)
    {
        $product->update($request->validated());

        return $this->success(
            $product,
            'Product updated',
            200,
        );
    }
}
