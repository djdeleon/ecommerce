<?php

namespace App\Actions;

use App\Models\Customer;
use App\Services\CartService;
use App\Services\CheckoutService;
use Illuminate\Http\Request;

class ProcessCheckoutAction
{
    public function __construct(
        protected CartService $cartService,
        protected CheckoutService $checkoutService,
    ) {}

    public function execute(Customer $customer, array $cartItemsId)
    {
        $customer = $customer->with(['customerAddresses.address.region'])->first();
        $customerAddress = $customer->customerAddresses->first();
        $customerZone = $customerAddress->address->region->zone;
        $customerCoords = $customerAddress->coordinates();

        $vendorItems = $this->cartService->getCartItemsByVendor($cartItemsId['selected_items_id']);

        $transformedVendorItems = $this->cartService->mapForCheckout($vendorItems, $customerCoords);

        $calculatedItems = $this->cartService->calculateItems($transformedVendorItems, $customerZone);

        return $this->checkoutService->summationForCheckout($calculatedItems);
    }
}