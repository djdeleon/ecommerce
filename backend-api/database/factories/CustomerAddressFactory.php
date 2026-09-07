<?php

namespace Database\Factories;

use App\Models\Customer;
use App\Models\CustomerAddress;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<CustomerAddress>
 */
class CustomerAddressFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'customer_id'    => Customer::factory(),
            'recipient_name' => 'John Doe',
            'phone_number'   => '09' . fake()->numerify('#########'),
            'is_default'     => true,
            'label'          => fake()->randomElement(['Home', 'Office', 'Warehouse HQ', 'Secondary Depot']),
        ];
    }
}
