<?php

namespace Database\Factories;

use App\Enums\OrderPackagePaymentStatus;
use App\Enums\OrderPackageStatus as EnumsOrderPackageStatus;
use App\Models\Customer;
use App\Models\Order;
use App\Models\OrderPackage;
use App\Models\OrderPackageItem;
use App\Models\OrderPackagePayment;
use App\Models\OrderPackageStatus;
use App\Models\User;
use App\Models\Variant;
use App\Models\Vendor;
use Illuminate\Database\Eloquent\Factories\Factory;
use Override;

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

    public function unpaid(): static
    {
        return $this->afterCreating(function (Order $order) {
            OrderPackage::factory()
                ->for($order)
                ->hasOrderPackageItems()
                ->hasOrderPackageStatuses()
                ->hasOrderPackagePayments()
                ->create();

            // OrderPackageItem::factory()->for($orderPackage)->create();
            // OrderPackageStatus::factory()->for($orderPackage)->create();
            // OrderPackagePayment::factory()->for($orderPackage)->create();
        });
    }

    public function paid()
    {
        return $this->afterCreating(function (Order $order) {
            $orderPackage = OrderPackage::factory()->for($order)->create();

            OrderPackageItem::factory()->for($orderPackage)->create();

            OrderPackageStatus::factory()->for($orderPackage)->create();
            OrderPackageStatus::factory()->for($orderPackage)->create([
                'status' => EnumsOrderPackageStatus::ToShip,
                'changed_by_id' => $order->customer->user_id,
                'notes' => 'Order has been paid.',
            ]);

            $payment = OrderPackagePayment::factory()->for($orderPackage)->create();
            $payment->update(['status' => OrderPackagePaymentStatus::Completed]);
        });
    }

    public function toReceive()
    {
        return $this->afterCreating(function (Order $order) {
            $orderPackage = OrderPackage::factory()->for($order)->create();

            OrderPackageItem::factory()->for($orderPackage)->create();

            OrderPackageStatus::factory()->for($orderPackage)->create();
            OrderPackageStatus::factory()->for($orderPackage)->create([
                'status' => EnumsOrderPackageStatus::ToShip,
                'changed_by_id' => $order->customer->user_id,
                'notes' => 'Order has been paid.',
            ]);
            OrderPackageStatus::factory()->for($orderPackage)->create([
                'status' => EnumsOrderPackageStatus::ToReceive,
                'changed_by_id' => $orderPackage->vendor->user_id,
                'notes' => 'Order is now being shipped.',
            ]);

            $payment = OrderPackagePayment::factory()->for($orderPackage)->create();
            $payment->update(['status' => OrderPackagePaymentStatus::Completed]);
        });
    }

    public function toReturn()
    {
        return $this->afterCreating(function (Order $order) {
            $orderPackage = OrderPackage::factory()->for($order)->create();

            OrderPackageItem::factory()->for($orderPackage)->create();

            OrderPackageStatus::factory()->for($orderPackage)->create();
            OrderPackageStatus::factory()->for($orderPackage)->create([
                'status' => EnumsOrderPackageStatus::ToShip,
                'changed_by_id' => $order->customer->user_id,
                'notes' => 'Order has been paid.',
            ]);
            OrderPackageStatus::factory()->for($orderPackage)->create([
                'status' => EnumsOrderPackageStatus::ToReceive,
                'changed_by_id' => $orderPackage->vendor->user_id,
                'notes' => 'Order is now being shipped.',
            ]);
            OrderPackageStatus::factory()->for($orderPackage)->create([
                'status' => EnumsOrderPackageStatus::ToReturn,
                'changed_by_id' => $order->customer->user_id,
                'notes' => 'Returning of order is now being processed.',
            ]);

            $payment = OrderPackagePayment::factory()->for($orderPackage)->create();
            $payment->update(['status' => OrderPackagePaymentStatus::Completed]);
        });

    }

    public function toPay(int $count = 1, ?string $paymentMethod = 'paypal'): static
    {
        return $this->has(OrderPackageItem::factory()->count($count)->toPayStatus())
                    ->has(OrderPackagePayment::factory()->state(['payment_method' => $paymentMethod, 'status' => OrderPackagePaymentStatus::Pending])->count(1));
    }

    public function toShip(int $count = 1): static
    {
        return $this->has(OrderPackageItem::factory()->count($count)->toShipStatus())
                    ->has(OrderPackagePayment::factory()->state(['transaction_reference' => 'PAYPAL-ORDER-12345', 'status' => OrderPackagePaymentStatus::Completed])->count(1));
    }
}
