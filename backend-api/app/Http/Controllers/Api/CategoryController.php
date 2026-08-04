<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CategoryRequest;
use App\Http\Resources\CategoryResource;
use App\Models\Category;
use App\Traits\HttpResponses;
use Illuminate\Http\JsonResponse;

class CategoryController extends Controller
{
    use HttpResponses;

    public function index(): JsonResponse
    {
        $categories = Category::with('children')->whereNull('parent_id')->get();

        return $this->success(
            CategoryResource::collection($categories),
            'Categories retrieved'
        );
    }

    public function store(CategoryRequest $request)
    {
        $category = Category::create($request->validated());

        return $this->success(
            new CategoryResource($category),
            'Category created',
            201,
        );
    }

    public function show(Category $category)
    {
        return $this->success(
            new CategoryResource($category),
            'Category retrieved',
        );
    }

    public function update(CategoryRequest $request, Category $category)
    {
        $category->update($request->validated());

        return $this->success(
            new CategoryResource($category),
            'Category updated',
        );
    }

    public function destroy(Category $category)
    {
        $category->delete();

        return $this->success(
            null,
            'Category deleted',
        );
    }
}
