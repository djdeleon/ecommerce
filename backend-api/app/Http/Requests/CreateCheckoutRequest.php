<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\DB;

class CreateCheckoutRequest extends FormRequest
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
            'selected_items_id' => [
                'required',
                'array',
                'min:1',
            ],
            'selected_items_id.*' => [
                'required',
                'integer',
                // Custom rule to verify existence and enforce tenant cart ownership
                function ($attribute, $value, $fail) {
                    $customer = $this->user()->customer;

                    $itemBelongsToUser = $customer->cart->cartItems()->where('id', $value)->get();

                    if (! $itemBelongsToUser) {
                        $fail("The selected item with ID {$value} is invalid or does not belong to your cart.");
                    }
                }
            ]
        ];
    }
}
