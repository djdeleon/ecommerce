<?php

namespace Database\Factories;

use App\Enums\OrderPackageStatus as EnumsOrderPackageStatus;
use App\Models\Customer;
use App\Models\OrderPackage;
use App\Models\OrderPackageStatus;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<OrderPackageStatus>
 */
class OrderPackageStatusFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'order_package_id' => OrderPackage::factory(),
            'status' => EnumsOrderPackageStatus::ToPay,
            'changed_by_id' => Customer::factory()->create()->user->id,
            'notes' => 'waiting for customer to pay',
        ];
    }
}
