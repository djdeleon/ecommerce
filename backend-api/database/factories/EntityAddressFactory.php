<?php

namespace Database\Factories;

use App\Models\Address\Barangay;
use App\Models\EntityAddress;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<EntityAddress>
 */
class EntityAddressFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $barangay = Barangay::inRandomOrder()->first() ?? Barangay::factory()->create();
        
        $city = $barangay->city;
        $province = $city->province; // Can be null if it's an NCR city (e.g., Manila/Quezon City)
        $region = $province ? $province->region : $city->region; // Fallback depending on your city relation

        return [
            'region_id'      => $region->id,
            'province_id'    => $province?->id, // Safe null handling for NCR/Metro Manila
            'city_id'        => $city->id,
            'barangay_id'    => $barangay->id,
            'street_address' => fake()->streetAddress() . ', ' . fake()->secondaryAddress(),
            'zip_code'       => $city->zip_code ?? fake()->numerify('####'),
        ];
    }
}
