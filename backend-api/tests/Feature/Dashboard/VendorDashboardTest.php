<?php

test('vendor can access their dashboard data', function () {
    actingAsRole('Vendor')
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
    actingAsRole('Customer')
        ->getJson(route('vendor.dashboard'))
        ->assertStatus(403);
});