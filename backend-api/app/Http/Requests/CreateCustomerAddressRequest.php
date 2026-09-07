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
            'detail_address' => [
                'required',
                'array',
                'min:1',
            ],
            'detail_address.recipient_name' => [
                'required', 
                'string', 
                'max:255'
            ],
            'detail_address.phone_number' => [
                'required', 
                'string', 
                'regex:/^(09|\+639)\d{9}$/'
            ],
            'detail_address.is_default' => [
                'boolean'
            ],
            'detail_address.label' => [
                'nullable', 
                'string', 
                'max:50'
            ],

            'address' => [
                'required',
                'array',
                'min:1',
            ],
            'address.region_id' => [
                'required', 
                'exists:regions,id'
            ],
            'address.province_id' => [
                'nullable', 
                'exists:provinces,id'
            ],
            'address.city_id' => [
                'required', 
                'exists:cities,id'
            ],
            'address.barangay_id' => [
                'required', 
                'exists:barangays,id'
            ],
            'address.street_address' => [
                'nullable', 
                'string', 
                'max:500'
            ],
            'address.zip_code' => [
                'nullable', 
                'string', 
                'max:10'
            ],
            'address.latitude' => [
                'max:10'
            ],
            'address.longitude' => [
                'max:11'
            ],
        ];
    }
}
