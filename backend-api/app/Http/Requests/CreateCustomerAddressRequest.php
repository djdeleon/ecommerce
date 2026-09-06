<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class CreateCustomerAddressRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->hasRole('customer');
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'recipient_name' => [
                'required', 
                'string', 
                'max:255'
            ],
            
            // Validates PH mobile formats (e.g., 09171234567 or +639171234567)
            'phone_number' => [
                'required', 
                'string', 
                'regex:/^(09|\+639)\d{9}$/'
            ],
            
            'region_id' => [
                'required', 
                'exists:regions,id'
            ],
            
            // Nullable because NCR cities do not belong to a province
            'province_id' => [
                'nullable', 
                'exists:provinces,id'
            ],
            
            'city_id' => [
                'required', 
                'exists:cities,id'
            ],

            'barangay_id' => [
                'required', 
                'exists:barangays,id'
            ],
            
            'street_address' => [
                'required', 
                'string', 
                'max:500'
            ],

            'zip_code' => [
                'required', 
                'string', 
                'max:10'
            ],

            'is_default' => [
                'boolean'
            ],
            
            'label' => [
                'nullable', 
                'string', 
                'max:50'
            ],
        ];
    }
}
