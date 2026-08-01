<?php

test('vendor can access their dashboard data', function () {
    actingAsRole(Roles::Vendor)
        ->getJson(route('vendor.dashboard'))
        ->assertStatus(200)
        ->assertJsonStructure([
            'data' => [
                'id',
                'name',
                'email'
            ]
        ]);
});

test('customers are blocked from the customer dashboard', function () {
    actingAsRole(Roles::Customer)
        ->getJson(route('vendor.dashboard'))
        ->assertStatus(403);
});

test('unauthenticated users are blocked from the vendor dashboard', function () {
    $this->getJson(route('vendor.dashboard'))
        ->assertStatus(401);
});