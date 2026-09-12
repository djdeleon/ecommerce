<?php

namespace App\Actions;

use App\Enums\OrderPackagePaymentStatus;
use App\Enums\OrderPackageStatus;
use App\Models\Customer;
use App\Models\Order;
use App\Services\Contracts\PaymentServiceInterface;
use App\Services\FulfillmentFacility\FulfillmentFacilityFactory;
use App\Services\Payments\PaymentServiceFactory;
use Exception;
use Illuminate\Support\Facades\DB;

class PlaceOrderAction
{
    public function __construct(
        protected PaymentServiceFactory $paymentFactory
    ) {}

    public function execute(Customer $customer, array $data): array
    {
        return DB::transaction(function () use ($customer, $data) {
            $order = $customer->orders()->create([
                'shipping_address' => $data['order_details']['shipping_address'],
                'total_amount' => $data['order_details']['total_amount'],
            ]);

            // $paymentService = $this->paymentFactory->make($data['order_details']['payment_method']);

            // $gatewayResponse = $paymentService->pay($order);

            // $isResponseVerified = $paymentService->gatewayResponseVerification($gatewayResponse);

            // if (! $isResponseVerified) {
            //     throw new Exception("Gateway response is not valid to proceed to make a payment: " . json_encode($gatewayResponse));
            // }

            // $this->packOrders($order, $gatewayResponse, $paymentService, $data, $customer);
            $this->packOrders($order, $data, $customer);

            // return $paymentService->orderCreationResponse($gatewayResponse);
        });
    }

    // private function packOrders(Order $order, array $response, PaymentServiceInterface $paymentService, array $data, Customer $customer): void
    private function packOrders(Order $order, array $data, Customer $customer): void
    {
        $vendorItems = collect($data['order_items']);

        // $vendorItems->each(function ($items, $key) use ($order, $response, $paymentService, $data, $customer) {
        $vendorItems->each(function ($item, $key) use ($order, $data, $customer) {
            
            $orderPackage = $order->orderPackages()->create(['vendor_id' => $item['vendor_id']]);

            $orderItems = $orderPackage->orderPackageItems()->createmany($item['items']);

            $orderItems->each(function ($orderPackageItem) {
                $fulfillmentFactory = new FulfillmentFacilityFactory();
                $fulfillmentService = $fulfillmentFactory->make($orderPackageItem);
                $isFulfilled = $fulfillmentService->execute($orderPackageItem);

                if (! $isFulfilled) {
                    throw new Exception('Failed to fulfill this item.');
                }

                dd($orderPackageItem->orderPackageItemFacilities);
            });

            // $fulfi



            // Order Package is where we gonna put the Shipping Fee right...

            // Reserve stock...

            $orderPackage->orderPackageStatuses()->create([
                'status' => OrderPackageStatus::ToPay,
                'changed_by_id' => $customer->user_id,
                'notes' => 'Waiting for payment.',
            ]);

            $orderPackage->orderPackagePayments()->create([
                'payment_method' => $paymentService->getPaymentMethod($response),
                'transaction_reference' => $paymentService->getTransactionReference($response),
                'amount_paid' => $data['order_details']['total_amount'],
                'status' => OrderPackagePaymentStatus::Pending,
            ]);
        });
    }
}
