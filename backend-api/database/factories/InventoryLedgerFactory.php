<?php

namespace Database\Factories;

use App\Models\InventoryLedger;
use App\Models\InventoryStock;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<InventoryLedger>
 */
class InventoryLedgerFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'inventory_stock_id' => InventoryStock::factory(),
            'user_id' => User::factory(),
            'delta_quantity' => fake()->numberBetween(1, 100),
            'entry_type' => 'restock',
            'created_at' => now(),

        ];
    }
}
