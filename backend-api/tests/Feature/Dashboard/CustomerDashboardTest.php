<?php

test('customer can access their dashboard data', function () {
    actingAsRole('Customer')
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
    actingAsRole('Vendor')
        ->getJson(route('customer.dashboard'))
        ->assertStatus(403);
});