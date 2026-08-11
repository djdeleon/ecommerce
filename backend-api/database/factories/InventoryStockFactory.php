<?php

namespace Database\Factories;

use App\Models\FulfillmentHub;
use App\Models\InventoryStock;
use App\Models\Variant;
use App\Models\Warehouse;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<InventoryStock>
 */
class InventoryStockFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $randomFacility = fake()->randomElement(['warehouse', 'fulfillment_hub']);

        $facilityType = $randomFacility === 'warehouse' ? Warehouse::class : FulfillmentHub::class;

        $facility = app()->make($facilityType)->factory();

        return [
            'variant_id' => Variant::factory(),
            'inventorable_type' => $facilityType,
            'inventorable_id' => $facility,
            'quantity_available' => fake()->numberBetween(1, 100),
            'quantity_reserved' => 0,
            // 'entry_type' => 'restock',
        ];
    }
}
