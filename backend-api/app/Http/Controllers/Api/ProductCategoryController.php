<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\ProductCategory;
use Closure;
use Illuminate\Support\Str;

class ProductCategoryController extends Controller
{
    public function store(Request $request)
    {
        $slug = Str::slug($request['name']);

        $request->validate([
            'name' => 'required'
        ]);

        ProductCategory::create([
            'name' => $request['name'],
            'slug' => $slug,
            'parent_id' => $request['parent_id']
        ]);

        return response()->json([
            'message' => 'Product Category created.'
        ]);
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
