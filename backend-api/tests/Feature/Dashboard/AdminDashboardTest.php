<?php

test('admin can access their dashboard data', function () {
    actingAsRole(Roles::Admin)
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
    actingAsRole(Roles::Vendor)
        ->getJson(route('admin.dashboard'))
        ->assertStatus(403);
});

test('unauthenticated users are blocked from the admin dashboard', function () {
    $this->getJson(route('admin.dashboard'))
        ->assertStatus(401);
});