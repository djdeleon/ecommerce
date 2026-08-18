<?php

use App\Models\Driver;
use App\Models\Vehicle;
use App\VehicleType;
use Illuminate\Testing\Fluent\AssertableJson;

test('a driver can see the list of its vehicles', function () {
    $driver = Driver::factory()->create();
    Vehicle::factory(3)->for($driver)->create();
    $vehicleA = $driver->vehicles->first();
    $vehicleB = $driver->vehicles->skip(1)->first();
    $vehicleC = $driver->vehicles->skip(2)->first();

    $this->actingAs($driver->user, 'sanctum')
        ->getJson(route('driver-vehicles.index'))
        ->assertOk()
        ->assertJson(fn (AssertableJson $json) => $json
            ->has('message')
            ->has('data', 3)
            ->where('data.0.id', $vehicleA->id)
            ->where('data.0.driver_id', $driver->id)
            ->where('data.0.plate_number', $vehicleA->plate_number)
            ->where('data.0.type', $vehicleA->type)
            ->where('data.1.id', $vehicleB->id)
            ->where('data.1.driver_id', $driver->id)
            ->where('data.1.plate_number', $vehicleB->plate_number)
            ->where('data.1.type', $vehicleB->type)
            ->where('data.2.id', $vehicleC->id)
            ->where('data.2.driver_id', $driver->id)
            ->where('data.2.plate_number', $vehicleC->plate_number)
            ->where('data.2.type', $vehicleC->type)
        );
});

test('a driver can visit the vehicle registration with vehicle type options', function () {
    $driver = Driver::factory()->create();

    $this->actingAs($driver->user, 'sanctum')
        ->getJson(route('driver-vehicles.create'))
        ->assertOk()
        ->assertJson(fn (AssertableJson $json) => $json
            ->has('message')
            ->has('data', 3)
            ->where('data.0.value', 'motorcycle')
            ->where('data.0.label', 'Motorcycle')
            ->where('data.1.value', 'van')
            ->where('data.1.label', 'Cargo Van')
            ->where('data.2.value', 'truck')
            ->where('data.2.label', 'Commercial Truck')
        );
});

test('a driver can register a vehicle', function () {
    $driver = Driver::factory()->create();

    $payload = [
        'plate_number' => 'DL-83104-XG',
        'type' => 'van',
    ];

    $this->actingAs($driver->user, 'sanctum')
        ->postJson(route('driver-vehicles.store'), $payload)
        ->assertCreated();
    
    $driver->fresh();

    expect($driver->vehicles->first())
        ->plate_number->toBe($payload['plate_number'])
        ->type->toBe(VehicleType::VAN);
});