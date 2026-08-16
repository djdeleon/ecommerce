<?php

use App\Models\Driver;
use App\Models\Vehicle;

test('a driver can have multiple vehicles', function () {
    $driver = Driver::factory()->create();
    Vehicle::factory(3)->for($driver)->create();
  
    expect($driver->vehicles->count())->toBe(3);
})->only();

test('a group of vehicles belongs to a driver', function () { 
    $drivers = Driver::factory(3)->hasVehicles(3)->create();

    expect($drivers->count())->toBe(3);

    foreach ($drivers as $driver) {
        expect($driver->vehicles->count())->toBe(3);

        foreach ($driver->vehicles as $vehicle) {
            expect($vehicle->driver_id)->toBe($driver->id)
                ->and($vehicle->driver->user->id)->toBe($driver->user->id);
        }
    }
})->only();

test('a driver has an active vehicle', function () {
    $driver = Driver::factory()->create();
    $vehicles = Vehicle::factory(2)->for($driver)->create();
    $activeVehicle = $vehicles->first();

    $driver->update(['active_vehicle_id' => $activeVehicle->id]);

    $driver->fresh();

    expect($driver->activeVehicle)
        ->id->toBe($activeVehicle->id)
        ->plate_number->toBe($activeVehicle->plate_number)
        ->and($activeVehicle->driver_id)->toBe($driver->id);
})->only();