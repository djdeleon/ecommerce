<?php

use App\Models\User;
use App\Models\Vehicle;

test('unauthenticated users cannot access driver vehicle endpoints', function () {
    $vehicle = Vehicle::factory()->create();

    $this->getJson(route('driver-vehicles.index'))
        ->assertUnauthorized();

    $this->getJson(route('driver-vehicles.create'))
        ->assertUnauthorized();

    $this->postJson(route('driver-vehicles.store'))
        ->assertUnauthorized();

    $this->patchJson(route('driver-vehicles.active', $vehicle))
        ->assertUnauthorized();
});

test('authenticated users cannot access driver vehicle endpoints', function (string $role) {
    $vehicle = Vehicle::factory()->create();
    
    $user = User::factory()->create();
    $user->assignRole($role);

    $this->actingAs($user, 'sanctum')
        ->getJson(route('driver-vehicles.index'))
        ->assertForbidden();

    $this->actingAs($user, 'sanctum')
        ->getJson(route('driver-vehicles.create'))
        ->assertForbidden();

    $this->actingAs($user, 'sanctum')
        ->postJson(route('driver-vehicles.store'))
        ->assertForbidden();

    $this->actingAs($user, 'sanctum')
        ->patchJson(route('driver-vehicles.active', $vehicle))
        ->assertForbidden();
})->with([
    'customer role' => 'customer',
    'vendor role' => 'vendor',
]);