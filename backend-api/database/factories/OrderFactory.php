<?php

namespace Database\Factories;

use App\Enums\OrderPaymentStatus;
use App\Models\Customer;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderPayment;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Order>
 */
class OrderFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'customer_id' => Customer::factory(),
            'shipping_address' => '123 Main St.',
            'total_amount' => "100.00",
        ];
    }

    public function toPay(int $count = 1): static
    {
        return $this->has(OrderItem::factory()->count($count)->toPayStatus())
                    ->has(OrderPayment::factory()->state(['status' => OrderPaymentStatus::PENDING])->count(1));
    }

    public function toShip(int $count = 1): static
    {
        return $this->has(OrderItem::factory()->count($count)->toShipStatus())
                    ->has(OrderPayment::factory()->state(['transaction_reference' => 'PAYPAL-ORDER-12345', 'status' => OrderPaymentStatus::COMPLETED])->count(1));
    }
}
