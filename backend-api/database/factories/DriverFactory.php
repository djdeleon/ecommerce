<?php

namespace Database\Factories;

use App\Models\Driver;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Driver>
 */
class DriverFactory extends Factory
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
            'license_number' => fake()->bothify('DL-#####-??'),
        ];
    }

    public function configure()
    {
        return $this->afterCreating(function (Driver $driver) {
            $driver->user->assignRole('driver');
        });
    }
}
