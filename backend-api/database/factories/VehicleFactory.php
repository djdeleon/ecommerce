<?php

namespace Database\Factories;

use App\Models\Driver;
use App\Models\Vehicle;
use App\VehicleType;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Vehicle>
 */
class VehicleFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'driver_id' => Driver::factory(),
            'plate_number' => fake()->bothify('???-####'),
            'type' => fake()->randomElement(VehicleType::cases()), 
        ];
    }
}
