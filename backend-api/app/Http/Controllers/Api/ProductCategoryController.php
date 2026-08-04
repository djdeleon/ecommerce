<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ProductCategoryRequest;
use App\Models\ProductCategory;

class ProductCategoryController extends Controller
{
    public function store(ProductCategoryRequest $request)
    {
        $category = ProductCategory::create($request->validated());

        return response()->json([
            'message' => 'Product Category created.',
            'data' => $category,
        ], 201);
    }

    public function show(ProductCategory $productCategory)
    {
        return response()->json([
            'message' => 'Category is fetched successfully.',
            'data' => $productCategory
        ], 200);
    }

    public function update(ProductCategoryRequest $request, ProductCategory $productCategory)
    {
        $productCategory->update($request->validated());

        return response()->json([
            'message' => 'Products Category updated.',
            'data' => $productCategory
        ], 200);
    }
}
