<?php

namespace Database\Factories;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Variant;
use Illuminate\Database\Eloquent\Factories\Factory;
use App\Enums\OrderItemStatus as OrderItemStatusEnum;
use App\Models\Vendor;

/**
 * @extends Factory<OrderItem>
 */
class OrderItemFactory extends Factory
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
            'variant_id' => Variant::factory(),
            'quantity_ordered' => 1,
            'price_at_purchased' => "100.00",
        ];
    }

    public function toPayStatus(): static
    {
        return $this->afterCreating(function (OrderItem $item) {
            $item->orderItemStatuses()->create([
                'status' => OrderItemStatusEnum::ToPay,
                'changed_by_id' => null,
                'notes' => 'Waiting for payment.',
            ]);
        });
    }

    public function toShipStatus(): static
    {
        return $this->afterCreating(function (OrderItem $item) {
            $item->orderItemStatuses()->create([
                'status' => OrderItemStatusEnum::ToPay,
                'changed_by_id' => null,
                'notes' => 'Waiting for payment.',
            ]);
            
            $item->orderItemStatuses()->create([
                'status' => OrderItemStatusEnum::ToShip,
                'changed_by_id' => $item->order->customer->user_id ?? 1,
                'notes' => 'payment completed.',
            ]);
        });
    }
}
