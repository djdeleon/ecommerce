<?php

use App\Enums\OrderPackagePaymentStatus;
use App\Enums\OrderPackageStatus as EnumsOrderPackageStatus;
use App\Models\Order;
use App\Models\OrderPackage;
use App\Models\OrderPackageItem;
use App\Models\OrderPackagePayment;
use App\Models\OrderPackageStatus;
use Illuminate\Database\Eloquent\Collection;

class OrderTestBuilder
{
    protected static Order $order;
    protected static Collection $orderPackages;

    public static function order(): self
    {
        self::$order = Order::factory()->create();

        return new static();
    }

    public function packages(int $count = 1): static
    {
        self::$orderPackages = OrderPackage::factory($count)->for(self::$order)->create();

        return new static();
    }

    public function withItems(int $count = 1): static
    {
        self::$orderPackages->each(function ($package) use ($count) {
            OrderPackageItem::factory($count)->for($package)->create();
        });

        return new static();
    }

    public function withStatuses(int $count = 1): static
    {
        self::$orderPackages->each(function ($package) use ($count) {
            OrderPackageStatus::factory($count)->for($package)->create();
        });

        return new static();
    }

    public function withPayments(int $count = 1, array $attributes = []): static
    {
        self::$orderPackages->each(function ($package) use ($count, $attributes) {
            if (isset($attributes['transaction_reference']) && is_callable($attributes['transaction_reference'])) {
                $attributes = array_merge($attributes, ['transaction_reference' => $attributes['transaction_reference'](self::$order)]);
            }

            OrderPackagePayment::factory($count)->for($package)->create($attributes);
        });

        return new static();
    }

    public function toPay($method = 'paypal'): Order
    {
        self::$orderPackages->each(function ($package) use ($method) {
            OrderPackagePayment::factory()->for($package)->create(['payment_method' => $method]);

            OrderPackageStatus::factory()->for($package)->create();
        });

        return self::$order;
    }

    public function toShip($method = 'paypal'): Order
    {
        self::$orderPackages->each(function ($package) use ($method) {
            $paymentStatus = OrderPackagePayment::factory()->for($package)->create(['payment_method' => $method]);
            $paymentStatus->update(['status' => OrderPackagePaymentStatus::Completed]);

            OrderPackageStatus::factory()->for($package)->create(['status' => EnumsOrderPackageStatus::ToPay]);
            OrderPackageStatus::factory()->for($package)->create(['status' => EnumsOrderPackageStatus::ToShip]);
        });

        return self::$order;
    }

    public function create(): Order
    {
        return self::$order;
    }
}