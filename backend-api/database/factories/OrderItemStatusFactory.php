<?php

namespace Database\Factories;

use App\Enums\OrderItemStatus as StatusEnum;
use App\Models\Customer;
use App\Models\OrderItem;
use App\Models\OrderItemStatus;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<OrderItemStatus>
 */
class OrderItemStatusFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'order_item_id' => OrderItem::factory(),
            'status' => StatusEnum::TO_PAY,
            'changed_by_id' => Customer::factory()->create()->user->id,
            'notes' => 'waiting for customer to pay',
        ];
    }
}
