<?php

namespace Database\Factories;

use App\Enums\UserRole;
use App\Models\Customer;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Customer>
 */
class CustomerFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'shipping_address' => '123 Main Street',
        ];
    }

    public function configure()
    {
        return $this->afterCreating(function (Customer $customer) {
            $customer->user->assignRole(UserRole::Customer);
            $customer->cart()->create();
        });
    }
}
