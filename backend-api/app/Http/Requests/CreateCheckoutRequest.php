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
            'selected_items' => [
                'required',
                'array',
                'min:1',
            ],
            'selected_items.*' => [
                'required',
                'integer',
                // Custom rule to verify existence and enforce tenant cart ownership
                function ($attribute, $value, $fail) {
                    $customer = $this->user()->customer;

                    $itemBelongsToUser = DB::table('cart_items')
                        ->join('carts', 'cart_items.cart_id', '=', 'carts.id')
                        ->where('cart_items.id', $value)
                        ->where('carts.customer_id', $customer->id)
                        ->exists();

                    if (! $itemBelongsToUser) {
                        $fail("The selected item with ID {$value} is invalid or does not belong to your cart.");
                    }
                }
            ]
        ];
    }
}
