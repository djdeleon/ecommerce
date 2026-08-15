<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CreateWarehouseRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $user = $this->user();

        if ($user->hasRole('admin') && !array_key_exists('vendor_id', $this->all())) {
            return false;
        }

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
            'address' => [
                'required',
                'string'
            ],
            'vendor_id' => [
                Rule::requiredIf($this->user()->hasRole('admin')),
                'integer',
                'exists:vendors,id',
            ],
        ];
    }
}
