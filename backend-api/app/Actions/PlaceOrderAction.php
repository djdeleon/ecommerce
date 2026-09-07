<?php

namespace App\Actions;

use App\Enums\OrderPackagePaymentStatus;
use App\Enums\OrderPackageStatus;
use App\Models\Customer;
use App\Models\FulfillmentHub;
use App\Models\InventoryStock;
use App\Models\Order;
use App\Models\Product;
use App\Models\Variant;
use App\Models\Vendor;
use App\Models\Warehouse;
use App\Services\Contracts\PaymentServiceInterface;
use App\Services\Payments\PaymentServiceFactory;
use Database\Factories\Address\AddressFactory;
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

    private function getVendorWithVariantWithMultipleWarehouses($customer)
    {
        $customerAddress = $customer->customerAddresses[0]->address;

        $vendor = vendor::factory()->create();

        $warehouseA = $vendor->warehouses()->create([
            'name' => 'Warehouse A',
            'contact_number' => '09171234567',
        ]);
        $address = AddressFactory::luzon('region_2');
        $warehouseA->warehouseAddress()->create($address);

        $warehouseB = $vendor->warehouses()->create([
            'name' => 'Warehouse B',
            'contact_number' => '09171232227',
        ]);
        $address = AddressFactory::visayas('region_7');
        $warehouseB->warehouseAddress()->create($address);

        $warehouseC = $vendor->warehouses()->create([
            'name' => 'Warehouse C',
            'contact_number' => '09171231239',
        ]);
        $address = AddressFactory::mindanao('region_10');
        $warehouseC->warehouseAddress()->create($address);

        // dd($vendor->warehouses);

        Product::factory()->hasVariants()->for($vendor)->create();

        $variant = $vendor->products[0]->variants[0];

        $variant->inventoryStocks()->create([
            'inventorable_type' => Warehouse::class,
            'inventorable_id' => $warehouseA->id,
            'quantity_available' => 5,
            'quantity_reserved' => 0,
        ]);
        $variant->inventoryStocks()->create([
            'inventorable_type' => Warehouse::class,
            'inventorable_id' => $warehouseB->id,
            'quantity_available' => 10,
            'quantity_reserved' => 0,
        ]);
        $variant->inventoryStocks()->create([
            'inventorable_type' => Warehouse::class,
            'inventorable_id' => $warehouseC->id,
            'quantity_available' => 15,
            'quantity_reserved' => 0,
        ]);
        $getCustomerCoordinates = [
            'lat' => $customerAddress->latitude,
            'lon' => $customerAddress->longitude,
        ];

        $getVariantWarehouseHubs = [];
        $getVariantFulfillmentHubs = [];

        $variant->inventoryStocks->each(function ($stock) use (&$getVariantWarehouseHubs, &$getVariantFulfillmentHubs) {
            if ($stock->inventorable_type === Warehouse::class) {
                $getVariantWarehouseHubs[$stock->inventorable->id] = [
                    'lat' => $stock->inventorable->warehouseAddress->latitude,
                    'lon' => $stock->inventorable->warehouseAddress->longitude,
                ];
            }

            if ($stock->inventorable_type === FulfillmentHub::class) {
                $getVariantFulfillmentHubs[] = $stock->inventorable;
            }
        });

        // dd($getCustomerCoordinates, $getVariantWarehouseHubs);

        // dd($variant->inventoryStocks[0]->inventorable->warehouseAddress);

        $warehouseId = $this->findNearestWarehouse($getCustomerCoordinates, $getVariantWarehouseHubs);

        $warehouse = Warehouse::findOrFail($warehouseId);

        /**
         * Let's pause for some time and do a clean up 
         * - for PSGC Addresses
         * - for Warehouse and Fulfillment Factory
         * - Remember the Scenarios
         * - Refactor the Test Cases
         * - Dedicated service for getting the lat and lon
         * 
         * Then we focus on the Fastify shipping fee calculation.
         * - we need to deal with the weight and dimension as well for more realistic J&T shipping fee calculation.
         * - - but settle with region to zone shipping calculation for now, and lay out other features like tracking number, webhook, barcode scanner.
         * 
         * 
         */
        dd($customerAddress->region, $warehouse->warehouseAddress->region);
    }

    private function findNearestWarehouse(array $customerCoords, array $warehouseHubs): int
    {
        $nearestWarehouseId = null;
        $shortestDistance = PHP_FLOAT_MAX;

        foreach ($warehouseHubs as $warehouseId => $coords) {
            $distance = $this->calculateHaversineDistance(
                $customerCoords['lat'],
                $customerCoords['lon'],
                $coords['lat'],
                $coords['lon'],
            );

            if ($distance < $shortestDistance) {
                $shortestDistance = $distance;
                $nearestWarehouseId = $warehouseId;
            }
        }

        return $nearestWarehouseId;
    }

    private function calculateHaversineDistance($lat1, $lon1, $lat2, $lon2): float
    {
        $earthRadius = 6371; // Radius of earth in kilometers

        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);

        $a = sin($dLat / 2) * sin($dLat / 2) +
            cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
            sin($dLon / 2) * sin($dLon / 2);
            
        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadius * $c; // Distance in KM
    }

    private function packOrders(Order $order, array $response, PaymentServiceInterface $paymentService, array $data, Customer $customer): void
    {
        $vendorItems = collect($data['order_items'])->groupBy('vendor_id');

        /**
         * I have to get the warehouse address of where the product is stocked.
         * - we also don't need to checkout is_default in the vendor warehouses, it is only for the customers.
         * 
         * where in the vendor warehouses is the stock item located?
         * - so we can get the origin (vendor warehouse) to destionation (customer default address/selected address) region and calculate shipping.
         * 
         * Inventory Stocks table is where we are linking the variants to the warehouse / fulfillment hub
         * 
         * I also need to find the nearest vendor warehouse/fulfillment
         * 
         * I want to have a vendor to have at least one variant that is in stock in 3 different Warehouses (Luzon, Visayas, Mindanao)
         * getVendorWithVariantWithMultipleWarehouses()
         */

        $this->getVendorWithVariantWithMultipleWarehouses($customer);

        // Find the nearest stock hub
        // we need to get all the matching regions for the customer region
        $customerRegion = $customer->customerAddresses[0]->region;
        $customerProvince = $customer->customerAddresses[0]->province;
        $customerCity = $customer->customerAddresses[0]->city;
        $customerBarangay = $customer->customerAddresses[0]->barangay;
        // dd($customerBarangay);

        $inventoryStocks = InventoryStock::factory()->create();
        $vendorItems->each(function ($item, $vendorId) use ($customerRegion, $customerProvince, $customerCity, $customerBarangay) {
            $item = Variant::findOrFail($item[0]['variant_id']);

            // dd($item->inventoryStocks);

            $vendor = Vendor::factory()->create();
            Product::factory()->hasVariants()->for($vendor)->create();

            Warehouse::factory()->for($vendor)->create();

            $vendorWarehouse = $vendor->warehouses[0];

            $variant = $vendor->products[0]->variants[0];

            $variant->inventoryStocks()->create([
                'inventorable_type' => Warehouse::class,
                'inventorable_id' => $vendorWarehouse->id,
                'quantity_available' => 5,
                'quantity_reserved' => 0,
            ]);

            $itemStockHubWithSameCustomerRegion = [];
            $itemStockHubWithSameCustomerProvince = [];
            $itemStockHubWithSameCustomerCity = [];
            $itemStockHubWithSameCustomerBarangay = [];

            $variantStockHubA = $variant->inventoryStocks[0]->inventorable;

            $variant->inventoryStocks->each(function ($stock) use ($customerRegion, $customerProvince, $customerCity, $customerBarangay, &$itemStockHubWithSameCustomerRegion, &$itemStockHubWithSameCustomerProvince, &$itemStockHubWithSameCustomerCity, &$itemStockHubWithSameCustomerBarangay) {
                if ($stock->inventorable instanceof Warehouse && $stock->inventorable->warehouseAddress->region->id === $customerRegion->id) {
                    $itemStockHubWithSameCustomerRegion[] = $stock->inventorable->warehouseAddress->region;

                    if ($stock->inventorable->warehouseAddress->province->id === $customerProvince->id) {
                        $itemStockHubWithSameCustomerProvince[] = $stock->inventorable->warehouseAddress->province;
                    }

                    if ($stock->inventorable->warehouseAddress->city->id === $customerCity->id) {
                        $itemStockHubWithSameCustomerCity[] = $stock->inventorable->warehouseAddress->city;
                    }

                    if ($stock->inventorable->warehouseAddress->barangay->id === $customerBarangay->id) {
                        $itemStockHubWithSameCustomerBarangay[] = $stock->inventorable->warehouseAddress->barangay;
                    }
                } else {
                    // for fulfillment hubs
                }
                // dd($stock->inventorable);
            });

            dd($itemStockHubWithSameCustomerRegion, $itemStockHubWithSameCustomerProvince, $itemStockHubWithSameCustomerCity, $itemStockHubWithSameCustomerBarangay);

            // dd($variantStockHubA->warehouseAddress->region);

            // dd($vendorId, $item->pluck('variant_id'));
            $stocks = InventoryStock::whereIn('variant_id', $item->pluck('variant_id'))->get();
            dd($stocks);
        });
        
        dd($inventoryStocks->inventorable->warehouseAddress);

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
