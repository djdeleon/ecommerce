<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class CreateOrderRequest extends FormRequest
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
            'order_details' => [
                'required',
                'array',
                'min:1',
            ],
            'order_details.customer_address_id' => [
                'required',
            ],
            'order_details.shipping_address' => [
                'required',
                'string',
            ],
            'order_details.payment_method' => [
                'required',
                'string',
            ],
            'order_details.total_amount' => [
                'required',
            ],
            'order_items' => [
                'required',
                'array',
                'min:1',
            ],
            'order_items.*.vendor_id' => [
                'required',
            ],
            'order_items.*.items.*.variant_id' => [
                'required',
            ],
            'order_items.*.items.*.ordered_quantity' => [
                'required',
            ],
            'order_items.*.items.*.price_at_purchased' => [
                'required',
            ],
        ];
    }
}
