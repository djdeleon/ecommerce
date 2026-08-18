<?php

namespace App\Http\Requests;

use App\VehicleType;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class CreateVehicleRequest extends FormRequest
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
            'plate_number' => [
                'required',
                'string',
            ],
            'type' => [
                'required',
                new Enum(VehicleType::class),
                'max:20',
            ]
        ];
    }
}
