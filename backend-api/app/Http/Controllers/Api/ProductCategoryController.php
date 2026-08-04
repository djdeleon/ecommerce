<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ProductCategoryRequest;
use Illuminate\Http\Request;
use App\Models\ProductCategory;
use Closure;
use Illuminate\Support\Str;

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

    public function update(Request $request, ProductCategory $productCategory)
    {
        $request->validate([
            'name' => 'required',
            'parent_id' => [
                    function (string $attribute, mixed $value, Closure $fail) use ($productCategory) {
                        if ($productCategory->id === $value) {
                            $fail("The {$attribute} cannot be applied to itself.");
                        }
                    }
            ]
        ]);

        if ($request['name'] !== $productCategory->name) {
            $productCategory->name = $request['name'];
            $productCategory->slug = Str::slug($request['name']);
        }

        $productCategory->parent_id = $request['parent_id'];
        $productCategory->save();
    }
}
