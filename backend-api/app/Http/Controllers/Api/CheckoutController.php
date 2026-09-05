<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CreateCheckoutRequest;
use App\Models\Variant;
use App\Traits\HttpResponses;
use Illuminate\Http\JsonResponse;
use Money\Currency;
use Money\Money;

class CheckoutController extends Controller
{
    use HttpResponses;

    public function store(CreateCheckoutRequest $request): JsonResponse
    {
        $variants = Variant::whereIn('id', $request['selected_items'])
        ->with(['product.vendor', 'cartItem']) 
        ->get();

        $vendorVariants = $variants->groupBy('product.vendor_id');

        $grandTotal = new Money(0, new Currency('USD'));

        $checkoutItems = $vendorVariants
            ->map(function ($variants) use (&$grandTotal) {
                $vendor = $variants->first()->product->vendor;

                $merchantTotal = new Money(0, new Currency('USD'));

                $merchantItems = $variants->map(function ($variant) use (&$merchantTotal, &$grandTotal) {
                    $quantity = $variant->cartItem->quantity;
                    
                    $totalAmount = $variant->price->multiply($quantity);
                    $merchantTotal = $merchantTotal->add($totalAmount);
                    $grandTotal = $grandTotal->add($totalAmount);

                    return [
                        'variant' => [
                            'id' =>  $variant->id,
                            'sku' => $variant->sku,
                        ],
                        'product' => [
                            'id' => $variant->product->id,
                            'name' => $variant->product->name,
                        ],
                        'quantity' => $quantity,
                        'unit_price' => bcdiv($variant->price->getAmount(), '10000', 2),
                        'total_amount' => bcdiv($totalAmount->getAmount(), '10000', 2),
                    ];
                })->values()->all();

                return [
                    'vendor_id' => $vendor->id,
                    'shop_name' => $vendor->shop_name,
                    'business_tin' => $vendor->business_tin,
                    'merchant' => [
                        'merchant_items' => $merchantItems,
                        'merchant_total' => bcdiv($merchantTotal->getAmount(), '10000', 2),
                    ],
                ];
            })
            ->values()
            ->all();
        
        $paymentMethods = [
            'Paypal',
            'Stripe'
        ];

        $paymentDetails = [
            'shipping_subtotal' => "0.00",
            'shipping_discount_subtotal' => "0.00",
            'voucher_discount' => "0.00",
            'grand_total' => bcdiv($grandTotal->getAmount(), '10000', 2),
        ];

        $data = [
            'checkout_items' => $checkoutItems,
            'payment_methods' => $paymentMethods,
            'payment_details' => $paymentDetails,
        ];

        return $this->success(
            $data,
            'Cart calculated',
        );
    }
}
