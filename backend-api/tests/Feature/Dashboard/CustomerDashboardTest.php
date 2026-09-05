<?php

use App\Enums\UserRole;

test('customer can access their dashboard data', function () {
    actingAsRole(UserRole::Customer)
        ->getJson(route('customer.dashboard'))
        ->assertStatus(200)
        ->assertJsonStructure([
            'data' => [
                'id',
                'name',
                'email'
            ]
        ]);
});

test('vendors are blocked from the customer dashbaord', function () {
    actingAsRole(UserRole::Vendor)
        ->getJson(route('customer.dashboard'))
        ->assertStatus(403);
});

test('unauthenticated users are blocked from the customer dashboard', function () {
    $this->getJson(route('customer.dashboard'))
        ->assertStatus(401);
});