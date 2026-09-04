<?php

namespace App\Actions;

use App\Enums\OrderPackagePaymentStatus;
use App\Enums\OrderPackageStatus;
use App\Models\Customer;
use App\Models\Order;
use App\Services\Contracts\PaymentServiceInterface;
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
            $order = $customer->orders()->create($data['order_details']);

            $paymentService = $this->paymentFactory->make($data['payment_method']);

            $gatewayResponse = $paymentService->pay($order);

            $isResponseVerified = $paymentService->gatewayResponseVerification($gatewayResponse);

            if (! $isResponseVerified) {
                throw new Exception("Gateway response is not valid to proceed to make a payment: " . json_encode($gatewayResponse));
            }

            $this->packOrders($order, $gatewayResponse, $paymentService, $data, $customer);

            return $paymentService->orderCreationResponse($gatewayResponse);
        });
    }

    private function packOrders(Order $order, array $response, PaymentServiceInterface $paymentService, array $data, Customer $customer): void
    {
        $vendorItems = collect($data['order_items'])->groupBy('vendor_id');

        $vendorItems->each(function ($items, $key) use ($order, $response, $paymentService, $data, $customer) {
            $orderPackage = $order->orderPackages()->create(['vendor_id' => $key]);

            $orderPackage->orderPackageItems()->createmany($items);

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
