<?php

namespace App\Casts;

use Illuminate\Contracts\Database\Eloquent\CastsAttributes;
use Illuminate\Database\Eloquent\Model;
use Money\Currency;
use Money\Money;

class MoneyCast implements CastsAttributes
{
    public function get(Model $model, string $key, mixed $value, array $attributes): Money
    {
        $minorUnit = bcmul($value, '10000', 0);

        return new Money($minorUnit, new Currency('USD'));
    }

    public function set(Model $model, string $key, mixed $value, array $attributes): string
    {
        if ($value instanceof Money) {
            return bcdiv($value->getAmount(), '10000', 4);
        }

        return bcadd($value, '0', 4);
    }
}