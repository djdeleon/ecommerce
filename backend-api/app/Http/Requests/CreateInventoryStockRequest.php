<?php

namespace App\Http\Requests;

use App\Models\Warehouse;
use App\Rules\ValidStockAdjustment;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class CreateInventoryStockRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $user = $this->user();
        $variant = $this->route('variant');

        if (!$variant || $variant->product->vendor->user_id !== $user->id) {
            return false;
        }

        if ($this->input('facility_type') === 'warehouse') {
            $warehouse = Warehouse::find($this->input('facility_id'));

            if (!$warehouse || $warehouse->vendor_id !== $variant->product->vendor_id) {
                return false;
            }
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
        $variant = $this->route('variant');

        return [
            'facility_type' => [
                'required',
                'string',
                'in:warehouse,fulfillment_hub',
            ],
            'facility_id' => [
                'required',
                'integer',
            ],
            'delta' => [
                'required',
                'integer',
                new ValidStockAdjustment($variant),
            ],
            'entry_type' => [
                'required',
                'string',
                'in:restock,adjustment,shrinkage',
            ]
        ];
    }
}
