<?php

namespace Database\Factories\Address;

use App\Models\Address\Barangay;
use App\Models\Address\City;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Barangay>
 */
class BarangayFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'city_id' => City::factory(),
            'code' => fake()->unique()->numerify('##########'),
            'correspondence_code' => fake()->unique()->numerify('#########'),
            'name' => 'Barangay ' . fake()->streetName(),
        ];
    }
}
