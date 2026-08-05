<?php

namespace Database\Factories;

use App\Models\User;
use App\Models\Vendor;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Vendor>
 */
class VendorFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = fake()->unique()->sentence(2);

        return [
            'user_id' => User::factory(),
            'shop_name' => rtrim(ucfirst($name), '.'),
            'business_tin' => fake()->unique()->numerify('###-###-###') 
        ];
    }

    public function configure()
    {
        return $this->afterCreating(function (Vendor $vendor) {
            $vendor->user->assignRole('vendor');
        });
    }
}
