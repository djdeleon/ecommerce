<?php

use App\Models\Driver;
use App\Models\User;
use App\Models\Vehicle;

test('an unauthenticated user can register as driver', function () {
    $payload = [
        'name' => 'Driver',
        'email' => 'driver@example.com',
        'password' => 'secretPassword123',
        'password_confirmation' => 'secretPassword123',
        'license_number' => 'XHX-1223'
    ];

    $response = $this->postJson(route('drivers.register'), $payload);
    $response->assertStatus(201)
            ->assertJsonStructure([
                'message',
                'data' => [
                    'user' => [
                        'id',
                        'name',
                        'email',
                        'driver' => [
                            'license_number',
                        ],
                    ],
                    'token',
                ],
            ]);

    $user = User::where('name', $payload['name'])->first();
    expect($user->hasRole('driver'))->toBeTrue();
})->only();

test('a driver can set an active vehicle', function () {
    $driver = Driver::factory()->create();
    $vehicle = Vehicle::factory()->for($driver)->create();

    $this->actingAs($driver->user, 'sanctum')
        ->patchJson(route('driver-vehicles.active', $vehicle))
        ->assertOk();
    
    expect($driver->fresh()->active_vehicle_id)->toBe($vehicle->id);
})->only();