<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpgradeVendorRequest extends FormRequest
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
            'shop_name' => [
                'required',
                'string',
                'max:100',
                'unique:vendors,shop_name',
            ],
            'business_tin' => [
                'required',
                'string',
                'max:100',
                'unique:vendors,business_tin',
            ],
        ];
    }
}
