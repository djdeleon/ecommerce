<?php

use App\Models\Driver;
use App\Models\Vehicle;

// test('a driver can only have one active vehicle', function () {
//     $driver = Driver::factory()->create();
//     $vehicles = Vehicle::factory(2)->for($driver)->create();
//     $activeVehicle = $vehicles->first();
//     $inactiveVehicle = $vehicles->skip(1)->first();

//     $this->actingAs($driver->user, 'sanctum')
//         ->patchJson(route('driver-vehicles.active', $activeVehicle))
//         ->assertOk();

//     $driver->fresh();
// })->only();