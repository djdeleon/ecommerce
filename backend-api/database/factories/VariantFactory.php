<?php

namespace Database\Factories;

use App\Models\Product;
use App\Models\Variant;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Variant>
 */
class VariantFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'product_id' => Product::factory(),
            'sku' => fake()->unique()->bothify('SKU-#####-????'),
            'price' => fake()->randomFloat(2, 10, 500),
            'actual_weight_kg' => fake()->numberBetween(1, 5),
            'package_height_cm' => fake()->numberBetween(1, 70),
            'package_length_cm' => fake()->numberBetween(1, 50),
            'package_width_cm' => fake()->numberBetween(1, 20),
        ];
    }
}
