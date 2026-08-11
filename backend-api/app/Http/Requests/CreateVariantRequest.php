<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class CreateVariantRequest extends FormRequest
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
        return [
            'sku' => [
                'required',
                'string',
                'unique:variants,sku',
            ],
            'price' => [
                'required',
                'numeric',
                'min:0',
                'decimal:0,4',
            ],

            'initial_stock' => ['nullable', 'array'],
            'initial_stock.facility_type' => ['required_with:initial_stock', 'string', 'in:warehouse,fulfillment_hub'],
            'initial_stock.facility_id' => ['required_with:initial_stock', 'integer'],
            'initial_stock.delta' => ['required_with:initial_stock', 'integer'],
        ];
    }
}
