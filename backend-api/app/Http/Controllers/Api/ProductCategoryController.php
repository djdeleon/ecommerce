<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\ProductCategory;
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
}
