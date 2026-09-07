<?php

namespace Database\Factories\Address;

use App\Models\Address\City;
use App\Models\Address\Province;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<City>
 */
class CityFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'province_id' => Province::factory(),
            'code' => fake()->unique()->numerify('##########'),
            'correspondence_code' => fake()->unique()->numerify('#########'),
            'name' => fake()->city() . ' City',
        ];
    }
}
