<?php

use App\Enums\UserRole;

test('admin can access their dashboard data', function () {
    actingAsRole(UserRole::Admin)
        ->getJson(route('admin.dashboard'))
        ->assertStatus(200)
        ->assertJsonStructure([
            'data' => [
                'id',
                'name',
                'email'
            ]
        ]);
});

test('vendors are blocked from the admin dashbaord', function () {
    actingAsRole(UserRole::Vendor)
        ->getJson(route('admin.dashboard'))
        ->assertStatus(403);
});

test('unauthenticated users are blocked from the admin dashboard', function () {
    $this->getJson(route('admin.dashboard'))
        ->assertStatus(401);
});