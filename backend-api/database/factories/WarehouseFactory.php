<?php

namespace Database\Factories;

use App\Models\EntityAddress;
use App\Models\Vendor;
use App\Models\Warehouse;
use Illuminate\Database\Eloquent\Factories\Factory;
use Override;

/**
 * @extends Factory<Warehouse>
 */
class WarehouseFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $types = [
            'Main Hub', 
            'Fulfillment Station', 
            'Dispatch Facility', 
            'Primary Stockhouse', 
            'Regional Depot',
            'Express Fulfillment'
        ];

        $storePrefix = fake()->company(); 

        return [
            'vendor_id' => Vendor::factory(),
            'name' => $storePrefix . ' ' . fake()->randomElement($types),
            // Generates valid Philippine mobile numbers (e.g., 0917xxxxxxx)
            'contact_number'   => '09' . fake()->numerify('#########'),
        ];
    }

    #[Override]
    public function configure()
    {
        return $this->afterCreating(function (Warehouse $warehouse) {
            $warehouse->address()->create(
                EntityAddress::factory()->raw() // .raw() generates the attributes array without saving a duplicate
            );
        });
    }
}
