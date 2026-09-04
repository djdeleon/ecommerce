<?php

namespace Database\Factories;

use App\Enums\OrderPackagePaymentStatus;
use App\Models\OrderPackage;
use App\Models\OrderPackagePayment;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<OrderPackagePayment>
 */
class OrderPackagePaymentFactory extends Factory
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
            'payment_method' => 'paypal',
            'transaction_reference' => fake()->numerify('TN-##########'),
            'amount_paid' => '100.00',
            'gateway_reference' => 'GY-' . fake()->uuid(),
            'status' => OrderPackagePaymentStatus::Pending,
        ];
    }
}
