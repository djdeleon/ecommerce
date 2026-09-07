<?php

namespace Database\Factories\Address;

use App\Models\Address\Province;
use App\Models\Address\Region;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Province>
 */
class ProvinceFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'region_id' => Region::factory(),
            'code' => fake()->unique()->numerify('##########'),
            'correspondence_code' => fake()->unique()->numerify('#########'),
            'name' => fake()->city() . ' Province',
        ];
    }
}
