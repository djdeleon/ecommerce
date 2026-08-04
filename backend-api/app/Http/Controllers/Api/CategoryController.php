<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CategoryRequest;
use App\Http\Resources\CategoryResource;
use App\Models\Category;

class CategoryController extends Controller
{
    public function store(CategoryRequest $request)
    {
        $category = Category::create($request->validated());

        return response()->json([
            'message' => 'Category created.',
            'data' => new CategoryResource($category)
        ], 201);
    }

    public function show(Category $category)
    {
        return response()->json([
            'message' => 'Category is fetched successfully.',
            'data' => new CategoryResource($category)
        ], 200);
    }

    public function update(CategoryRequest $request, Category $category)
    {
        $category->update($request->validated());

        return response()->json([
            'message' => 'Category updated.',
            'data' => new CategoryResource($category)
        ], 200);
    }

    public function destroy(Category $category)
    {
        $category->delete();

        return response()->json([
            'message' => 'Category deleted.'
        ], 200);
    }
}
