<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProductCategoryRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $category = $this->route('productCategory');

        return [
            'name' => 'required|string|max:255',
            'parent_id' => [
                'nullable',
                'exists:product_categories,id',
                Rule::when($category !== null, [
                    Rule::notIn($category?->id)
                ])
            ]
        ];
    }

    public function messages(): array
    {
        return [
            'parent_id.not_in' => 'A category cannot be set as its own parent.'
        ];
    }
}
