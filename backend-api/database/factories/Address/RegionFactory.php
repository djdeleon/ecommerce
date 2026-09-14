<?php

namespace Database\Factories\Address;

use App\Models\Address\Region;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Region>
 */
class RegionFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'code' => fake()->unique()->numerify('##########'),
            'correspondence_code' => fake()->unique()->numerify('#########'),
            'name' => fake()->state() . ' Region',
            'slug' => fake()->unique()->regexify('[a-z]{5,15}'),
            'zone' => 'metro_manila',
        ];
    }

    public function luzon(): static
    {
        return $this->afterCreating(function (Region $region) {
            $region->update([
                'code' => '0300000000',
                'correspondence_code' => '030000000',
                'name' => 'Central Luzon (Region III)',
                'slug' => 'region_3',
            ]);

            $province = $region->provinces()->create([
                'code' => '0314000000',
                'correspondence_code' => '031400000',
                'name' => 'Bulacan',
            ]);

            $city = $province->cities()->create([
                'code' => '0314220000',
                'correspondence_code' => '031422000',
                'name' => 'City of San Jose del Monte',
            ]);

            $city->barangays()->create([
                'code' => '0314220220',
                'correspondence_code' => '031422022',
                'name' => 'Tungkong Mangga',
            ]);
        });
    }

    public function visayas(): static
    {
        return $this->afterCreating(function (Region $region) {
            $region->update([
                'code' => '0600000000',
                'correspondence_code' => '060000000',
                'name' => 'Region VI (Western Visayas)',
                'slug' => 'region_6',
            ]);

            $province = $region->provinces()->create([
                'code' => '0645000000',
                'correspondence_code' => '064500000',
                'name' => 'Negros Occidental',
            ]);

            $city = $province->cities()->create([
                'region_id' => $region->id,
                'province_id' => $province->id,
                'code' => '0645010000',
                'correspondence_code' => '064501000',
                'name' => 'Bacolod City',
            ]);

            $city->barangays()->create([
                'code' => '0645010050',
                'correspondence_code' => '064501005',
                'name' => 'Barangay 5 (Poblacion)',
            ]);
        });
    }

    public function mindanao(): static
    {
        return $this->afterCreating(function (Region $region) {
            $region->update([
                'code' => '1000000000',
                'correspondence_code' => '100000000',
                'name' => 'Region X (Northern Mindanao)',
                'slug' => 'region_10',
            ]);

            $province = $region->provinces()->create([
                'code' => '1043000000',
                'correspondence_code' => '104300000',
                'name' => 'Misamis Oriental',
            ]);

            $city = $province->cities()->create([
                'region_id' => $region->id,
                'province_id' => $province->id,
                'code' => '1043050000',
                'correspondence_code' => '104305000',
                'name' => 'Cagayan de Oro City',
            ]);

            $city->barangays()->create([
                'code' => '1043050110',
                'correspondence_code' => '104305011',
                'name' => 'Macasandig',
            ]);
        });
    }
}
