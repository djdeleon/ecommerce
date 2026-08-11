<?php

namespace App\Rules;

use App\Models\FulfillmentHub;
use App\Models\Variant;
use App\Models\Warehouse;
use Closure;
use Illuminate\Contracts\Validation\DataAwareRule;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Translation\PotentiallyTranslatedString;

class ValidStockAdjustment implements ValidationRule, DataAwareRule
{
    protected array $data = [];

    public function __construct(protected Variant $variant) {}

    public function setData(array $data): static
    {
        $this->data = $data;
        return $this;
    }
    /**
     * Run the validation rule.
     *
     * @param  Closure(string, ?string=): PotentiallyTranslatedString  $fail
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $delta = (int) $value;

        if ($delta >= 0) {
            return;
        }

        $facilityType = ($this->data['facility_type'] ?? '') === 'warehouse'
            ? Warehouse::class
            : FulfillmentHub::class;

        $facilityId = $this->data['facility_id'] ?? null;

        $stock = $this->variant->inventoryStocks()
            ->where('inventorable_type', $facilityType)
            ->where('inventorable_id', $facilityId)
            ->first();

        $currentAvailable = $stock ? $stock->quantity_available : 0;

        if (($currentAvailable + $delta) < 0) {
            $fail("Insufficient stock available to perform this adjustment.");
        }
    }
}
