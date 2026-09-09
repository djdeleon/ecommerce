<?php

use App\DataObjects\Coordinate;
use App\Models\Customer;
use App\Models\CustomerAddress;
use App\Models\EntityAddress;
use App\Models\FulfillmentHub;
use App\Models\Vendor;
use App\Models\Warehouse;
use App\Services\GeolocationService;
use Database\Factories\Address\AddressFactory;
use Illuminate\Support\Facades\Http;

it('calculates the nearest distance km from multiple locations based on coordinates', function () {
    $geoService = new GeolocationService();

    // Region 1 (Luzon)
    $customer = Customer::factory()->create();
    $customerAddress = CustomerAddress::factory()->for($customer)->create();
    $address = AddressFactory::luzon();
    $customerAddress->address()->create($address);
    $customerCoords = $customer->customerAddresses[0]->coordinates();

    // Region 2 (Luzon)
    $vendor = Vendor::factory()->create();
    $vendorWarehouseA = Warehouse::factory()->for($vendor)->create();
    $address = AddressFactory::luzon('region_2');
    $vendorWarehouseA->address()->create($address);
    $vWCoordsA = $vendorWarehouseA->coordinates();

    // Region 6 (Visayas)
    $vendorWarehouseB = Warehouse::factory()->for($vendor)->create();
    $address = AddressFactory::visayas('region_6');
    $vendorWarehouseB->address()->create($address);
    $vWCoordsB = $vendorWarehouseB->coordinates();

    // Region 9 (Mindanao)
    $vendorWarehouseC = Warehouse::factory()->for($vendor)->create();
    $address = AddressFactory::mindanao('region_9');
    $vendorWarehouseC->address()->create($address);
    $vWCoordsC = $vendorWarehouseC->coordinates();

    $coordsN = [
        $vendorWarehouseA->address->id => $vWCoordsA,
        $vendorWarehouseB->address->id => $vWCoordsB,
        $vendorWarehouseC->address->id => $vWCoordsC,
    ];

    $nearestId = $geoService->nearestFromMultipleLocations($customerCoords, $coordsN);

    $nearestLocation = EntityAddress::findOrFail($nearestId);

    expect($nearestLocation->region->slug)->toBe('region_2');
});

it('gets the coordinates', function () {
    $geoService = new GeolocationService();

    $customer = Customer::factory()->create();
    $customerAddress = CustomerAddress::factory()->for($customer)->create();
    $address = AddressFactory::luzon();
    $customerAddress->address()->create($address);
    $selectedAddress = $customer->customerAddresses[0];

    Http::fake([
        '*.openstreetmap.org/*' => Http::response([
            new Coordinate(16.0224, 120.3449)
        ], 200)
    ]);

    $coords = $geoService->getCoordinates($selectedAddress);

    expect($coords->lat)
        ->not->toBeNull()
        ->toBeFloat();
    expect($coords->lon)
        ->not->toBeNull()
        ->toBeFloat();

    $vendor = Vendor::factory()->create();
    $vendorWarehouse = Warehouse::factory()->for($vendor)->create();
    $address = AddressFactory::luzon('region_2');
    $vendorWarehouse->address()->create($address);
    $coords = $geoService->getCoordinates($vendorWarehouse->fullAddress());

    expect($coords->lat)
        ->not->toBeNull()
        ->toBeFloat();
    expect($coords->lon)
        ->not->toBeNull()
        ->toBeFloat();

    $fulfillmentHub = FulfillmentHub::factory()->create();
    $address = AddressFactory::luzon('region_3');
    $fulfillmentHub->address()->create($address);
    $coords = $geoService->getCoordinates($fulfillmentHub->fullAddress());

    expect($coords->lat)
        ->not->toBeNull()
        ->toBeFloat();
    expect($coords->lon)
        ->not->toBeNull()
        ->toBeFloat();
});