<?php

test('driver can access their dashboard data', function () {
    actingAsRole(Roles::Driver)
        ->getJson(route('drivers.dashboard'))
        ->assertStatus(200)
        ->assertJsonStructure([
            'data' => [
                'id',
                'name',
                'email'
            ]
        ]);
});

test('vendors are blocked from the driver dashboard', function () {
    actingAsRole(Roles::Vendor)
        ->getJson(route('drivers.dashboard'))
        ->assertStatus(403);
});

test('unauthenticated users are blocked from the driver dashboard', function () {
    $this->getJson(route('drivers.dashboard'))
        ->assertStatus(401);
});