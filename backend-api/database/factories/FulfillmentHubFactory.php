<?php

namespace Database\Factories;

use App\Models\FulfillmentHub;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<FulfillmentHub>
 */
class FulfillmentHubFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $types = ['Fulfillment Hub', 'Logistics Center', 'Distribution Depot', 'Supply Node', 'Gateway'];

        return [
            'name' => fake()->city() . ' ' . fake()->randomElement($types),
        ];
    }
}
