<?php

namespace Database\Factories;

use App\Enums\OrderPaymentStatus;
use App\Models\Order;
use App\Models\OrderPayment;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<OrderPayment>
 */
class OrderPaymentFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'order_id' => Order::factory(),
            'payment_method' => 'paypal',
            'transaction_reference' => fake()->numerify('TN-##########'),
            'amount_paid' => '100.00',
            'gateway_reference' => 'GY-' . fake()->uuid(),
            'status' => OrderPaymentStatus::PENDING,
        ];
    }
}
